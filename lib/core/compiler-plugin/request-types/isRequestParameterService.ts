import { Node, Type } from 'ts-morph';
import { Context, Effect, Option } from 'effect';
import { NotLiteralStringError } from '../errors/NotLiteralStringError';
import { TypeInferenceFailedError } from '../errors/TypeInferenceFailedError';
import { MissingPropertyError } from '../errors/MissingPropertyError';
import { CompilerPluginError } from '../errors/CompilerPluginError';

export type IsRequestParameterType = (
  node: Node,
  type: Type
) => Effect.Effect<never, CompilerPluginError, Option.Option<{ name: string; intersectionType: Type[] }>>;

export const isRequestParameterService = Context.Tag<IsRequestParameterType>();

export const isRequestParameterDefaultImplementation = Effect.provideService(
  isRequestParameterService,
  isRequestParameterService.of(
    (
      node: Node,
      type: Type
    ): Effect.Effect<never, CompilerPluginError, Option.Option<{ name: string; intersectionType: Type[] }>> => {
      if (!type.isIntersection()) {
        return Effect.succeedNone;
      }

      const intersectionTypes = type.getIntersectionTypes();
      const pathParamObject: Type | undefined = intersectionTypes.find(
        t =>
          (t.isObject() &&
            t.getProperty('swaggerfyTsType')?.getValueDeclaration()?.getType().getText() ===
              '"SwaggerfyTsPathParam"') ||
          false
      );
      if (pathParamObject === undefined) {
        return Effect.succeedNone;
      }

      const nameParam = pathParamObject.getProperty('swaggerfyTsName');
      if (nameParam === undefined) {
        return Effect.fail(
          new MissingPropertyError(node, 'Expected SwaggerfyTsPathParam to have property "swaggerfyTsName"')
        );
      }

      const nameParamType = nameParam.getTypeAtLocation(node);
      if (!nameParamType.isStringLiteral()) {
        return Effect.fail(new NotLiteralStringError(node, 'Name of PathParam must be a string literal type'));
      }

      const name = nameParamType.compilerType.value;
      const intersectionType = intersectionTypes.filter(type => type !== pathParamObject);

      if (intersectionType.length === 0 || intersectionTypes.length - 1 !== intersectionType.length) {
        return Effect.fail(
          new TypeInferenceFailedError(
            node,
            'After identifying a PathParam object, the type of the PathParam cannot be inferred'
          )
        );
      }

      return Effect.succeedSome({ name, intersectionType });
    }
  )
);
