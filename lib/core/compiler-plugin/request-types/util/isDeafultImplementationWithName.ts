import { Node, Type } from 'ts-morph';
import { Effect, Option, pipe, ReadonlyArray } from 'effect';
import { NotLiteralStringError } from '../../errors/NotLiteralStringError';
import { TypeInferenceFailedError } from '../../errors/TypeInferenceFailedError';
import { MissingPropertyError } from '../../errors/MissingPropertyError';
import { CompilerPluginError } from '../../errors/CompilerPluginError';
import { UnionNotAllowedError } from '../../errors/UnionNotAllowedError';
import type { FakeUnionOrIntersectionType } from './FakeUnionOrIntersectionType';

export const isDeafultImplementationWithName =
  (swaggerfyTsType: string) =>
  (
    node: Node,
    type: Type
  ): Effect.Effect<
    never,
    CompilerPluginError,
    Option.Option<{ node: Node; type: Type | FakeUnionOrIntersectionType; name: string }>
  > => {
    // UNIONS EXPAND! createPathParam<1 | 2, 'a'> = createPathParam<1, 'a'> | createPathParam<2, 'a'>
    if (type.isUnion()) {
      const unionTypes = type.getUnionTypes();
      return pipe(
        unionTypes,
        // [Type, Type]
        ReadonlyArray.map(unionType => isDeafultImplementationWithName(swaggerfyTsType)(node, unionType)),
        // [Effect.Effect<never, CompilerPluginError, Option.Option<{ name: string; types: Type[] }>>, Effect.Effect<never, CompilerPluginError, Option.Option<{ name: string; types: Type[] }>>]
        Effect.all,
        //Effect.Effect<never, CompilerPluginError, [Option.Option<{ name: string; types: Type[] }>, Option.Option<{ name: string; types: Type[] }>]>
        Effect.map(Option.all),
        //Effect.Effect<never, CompilerPluginError, Option.Option<[{ name: string; types: Type[] }, { name: string; types: Type[] }]>>
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.fail(new UnionNotAllowedError(node, `Union with ${swaggerfyTsType} not allowed!`)),
            onSome: Effect.succeed,
          })
        ),
        //Effect.Effect<never, CompilerPluginError, [{ name: string; types: Type[] }, { name: string; types: Type[] }]>>
        Effect.flatMap(results => {
          if (results.some(f => f.name !== results[0]!.name)) {
            return Effect.fail(new UnionNotAllowedError(node, `Union with multiple ${swaggerfyTsType} not allowed!`));
          }

          return Effect.succeedSome({
            name: results[0]!.name,
            node,
            type: {
              fakeUnionOrIntersectionType: true,
              types: results.map(r => r.type),
              join: 'union',
            },
          });
        })
      );
    }

    if (!type.isIntersection()) {
      return Effect.succeedNone;
    }

    const intersectionTypes = type.getIntersectionTypes();
    const swaggerfyObject: Type | undefined = intersectionTypes.find(
      t =>
        (t.isObject() &&
          t.getProperty('swaggerfyTsType')?.getValueDeclaration()?.getType().getText() === `"${swaggerfyTsType}"`) ||
        false
    );
    if (swaggerfyObject === undefined) {
      return Effect.succeedNone;
    }

    const nameParam = swaggerfyObject.getProperty('swaggerfyTsName');
    if (nameParam === undefined) {
      return Effect.fail(
        new MissingPropertyError(node, `Expected ${swaggerfyTsType} to have property "swaggerfyTsName"`)
      );
    }

    const nameParamType = nameParam.getTypeAtLocation(node);
    if (!nameParamType.isStringLiteral()) {
      return Effect.fail(new NotLiteralStringError(node, `Name of ${swaggerfyTsType} must be a string literal type`));
    }

    const name = nameParamType.compilerType.value;
    const types = intersectionTypes.filter(type => type !== swaggerfyObject);

    if (types.length === 0 || intersectionTypes.length - 1 !== types.length || types[0] === undefined) {
      return Effect.fail(
        new TypeInferenceFailedError(
          node,
          `After identifying a ${swaggerfyTsType} object, the type of the ${swaggerfyTsType} cannot be inferred`
        )
      );
    }

    return Effect.succeedSome({
      name,
      node,
      type:
        types.length === 1
          ? types[0]
          : {
              fakeUnionOrIntersectionType: true,
              types,
              join: 'intersection',
            },
    });
  };
