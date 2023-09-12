import { Node, Type } from 'ts-morph';
import { Context, Effect, Option, pipe, ReadonlyArray } from 'effect';
import { CompilerPluginError } from '../errors/CompilerPluginError';
import type { FakeUnionOrIntersectionType } from './util/FakeUnionOrIntersectionType';
import { TypeInferenceFailedError } from '../errors/TypeInferenceFailedError';

export type IsRequestBodyType = (
  node: Node,
  type: Type
) => Effect.Effect<unknown, CompilerPluginError, Option.Option<{ node: Node; type: Type | FakeUnionOrIntersectionType }>>;

export const isRequestBodyService = Context.Tag<IsRequestBodyType>();

export const defaultImplementation = isRequestBodyService.of((node, type) => {
  // UNIONS EXPAND! createPathParam<1 | 2, 'a'> = createPathParam<1, 'a'> | createPathParam<2, 'a'>
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    return pipe(
      unionTypes,
      // [Type, Type]
      ReadonlyArray.map(unionType => defaultImplementation(node, unionType)),
      // [Effect.Effect<never, CompilerPluginError, Option.Option<{ types: Type[] }>>, Effect.Effect<never, CompilerPluginError, Option.Option<{ name: string; types: Type[] }>>]
      Effect.all,
      //Effect.Effect<never, CompilerPluginError, [Option.Option<{ types: Type[] }>, Option.Option<{ name: string; types: Type[] }>]>
      Effect.map(Option.all),
      //Effect.Effect<never, CompilerPluginError, Option.Option<[{ types: Type[] }, { name: string; types: Type[] }]>>
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.succeedNone,
          onSome: results =>
            Effect.succeedSome({
              node,
              type: {
                fakeUnionOrIntersectionType: true,
                types: results.map(r => r.type),
                join: 'union',
              },
            }),
        })
      )
    );
  }

  if (!type.isIntersection()) {
    return Effect.succeedNone;
  }

  const intersectionTypes = type.getIntersectionTypes();
  const swaggerfyObject: Type | undefined = intersectionTypes.find(
    t =>
      (t.isObject() &&
        t.getProperty('swaggerfyTsType')?.getValueDeclaration()?.getType().getText() === '"SwaggerfyTsRequestBody"') ||
      false
  );
  if (swaggerfyObject === undefined) {
    return Effect.succeedNone;
  }

  const types = intersectionTypes.filter(type => type !== swaggerfyObject);
  if (types.length === 0 || intersectionTypes.length - 1 !== types.length || types[0] === undefined) {
    return Effect.fail(
      new TypeInferenceFailedError(
        node,
        'After identifying a SwaggerfyTsRequestBody object, the type of the SwaggerfyTsRequestBody cannot be inferred'
      )
    );
  }

  return Effect.succeedSome({
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
});

export const isRequestBodyDefaultImplementation = Effect.provideService(isRequestBodyService, defaultImplementation);
