import { Context, Effect, pipe, ReadonlyArray, ReadonlyRecord, String, Tuple } from 'effect';
import { HeaderSerializeError } from '../errors/HeaderSerializeError';
import { HeaderParseError } from '../errors/HeaderParseError';
import { FakeUnionOrIntersectionType } from '../../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';
import { Node, Type } from 'ts-morph';
import { TypeNotSupportedError } from '../../compiler-plugin/errors/TypeNotSupportedError';
import { isFakeUnionOrIntersectionType } from '../../compiler-plugin/request-types/util/isFakeUnionOrIntersectionType';
import { TypeInferenceFailedError } from '../../compiler-plugin/errors/TypeInferenceFailedError';
import { CompilerPluginError } from '../../compiler-plugin/errors/CompilerPluginError';
import { propertyIsFunction } from '../../compiler-plugin/util/propertyIsFunction';

export type HeaderIoServicePosition = 'path parameter' | 'header' | 'cookie';
export interface HeaderIoServiceType<ParseContext> {
  readonly getParserContext: (
    position: HeaderIoServicePosition,
    type: Type | FakeUnionOrIntersectionType,
    node: Node
  ) => Effect.Effect<never, CompilerPluginError, ParseContext>;
  readonly parse: (serialized: string, parseContext: ParseContext) => Effect.Effect<never, HeaderParseError, unknown>;
  readonly serialize: (unserialized: any) => Effect.Effect<never, HeaderSerializeError, string>;
}

export const headerIoService = Context.Tag<HeaderIoServiceType<any>>();

type BasicParserResult = 'null' | 'boolean' | 'string' | 'number';
type ArrayParserResult = `array_${BasicParserResult}`;
type ObjectParserResult = `object_${BasicParserResult}`;
type ParserResult = BasicParserResult | ArrayParserResult | ObjectParserResult;
const isArrayResult = (i: ParserResult): i is ArrayParserResult => i.startsWith('array_');
const isObjectResult = (i: ParserResult): i is ObjectParserResult => i.startsWith('object_');
const toBasicParserResult = (i: ArrayParserResult | ObjectParserResult) =>
  (isArrayResult(i) ? i.substring('array_'.length) : i.substring('object_'.length)) as BasicParserResult;
const defaultImplementation: HeaderIoServiceType<{ position: HeaderIoServicePosition; result: ParserResult }> = {
  getParserContext: (position, type, node) => {
    const parser = (
      type: Type | FakeUnionOrIntersectionType
    ): Effect.Effect<never, CompilerPluginError, ParserResult> => {
      if (isFakeUnionOrIntersectionType(type) || type.isUnion() || type.isEnum() || type.isIntersection()) {
        const join = isFakeUnionOrIntersectionType(type) ? type.join : type.isIntersection() ? 'intersection' : 'union';
        const subTypes = isFakeUnionOrIntersectionType(type)
          ? type.types
          : type.isIntersection()
          ? type.getIntersectionTypes()
          : type.getUnionTypes();

        if (join === 'union') {
          return pipe(
            subTypes,
            // [Type, Type]
            ReadonlyArray.map(parser),
            // [Effect<..., ..., 'string'>, Effect<..., ..., 'string'>]
            Effect.all,
            // Effect<..., ..., ['string', 'string'>]>
            Effect.flatMap(results => {
              if (results[0] === undefined) {
                return Effect.fail(
                  new TypeInferenceFailedError(node, 'After identifying a union, the union types cannot be inferred')
                );
              }
              return results.every(result => result === result[0])
                ? Effect.succeed(results[0])
                : Effect.fail(
                    new TypeNotSupportedError(
                      node,
                      `union of different types (detected ${results.join(', ')})`,
                      position
                    )
                  );
            })
          );
        }

        return pipe(
          subTypes,
          // [Type, Type]
          ReadonlyArray.map(parser),
          // [Effect<..., ..., 'string'>, Effect<..., ..., 'string'>]
          Effect.all,
          // Effect<..., ..., ['string', 'string'>]>
          Effect.flatMap(results => {
            if (results[0] === undefined) {
              return Effect.fail(
                new TypeInferenceFailedError(
                  node,
                  'After identifying a intersection, the intersection types cannot be inferred'
                )
              );
            }

            if (results.every(result => isObjectResult(result) && result === results[0])) {
              return Effect.succeed(results[0]);
            }

            //ignore "branded" types: "string & {__brand: 'swaggerfy'}" should return "string"
            const resultsWithoutObjects = results.filter(result => !isObjectResult(result));
            if (resultsWithoutObjects.length === 1 && resultsWithoutObjects[0] !== undefined) {
              return Effect.succeed(resultsWithoutObjects[0]);
            }

            return Effect.fail(
              new TypeNotSupportedError(
                node,
                `intersection of different types (detected ${results.join(', ')})`,
                position
              )
            );
          })
        );
      }
      if (type.isNull() || type.isUndefined() || type.isVoid()) {
        return Effect.succeed('null');
      }
      if (type.isBoolean() || type.isBooleanLiteral()) {
        return Effect.succeed('boolean');
      }
      if (type.isString()) {
        return Effect.succeed('string');
      }
      if (type.isNumber()) {
        return Effect.succeed('number');
      }
      if (type.isArray()) {
        const arrayType = type.getArrayElementType();
        if (arrayType === undefined) {
          return Effect.fail(
            new TypeInferenceFailedError(node, 'After identifying an array, the type of the array cannot be inferred')
          );
        }
        return pipe(
          parser(arrayType),
          Effect.flatMap(subResult => {
            if (isArrayResult(subResult)) {
              return Effect.fail(new TypeNotSupportedError(node, 'multidimensional arrays', position));
            }
            if (isObjectResult(subResult)) {
              return Effect.fail(new TypeNotSupportedError(node, 'array of objects', position));
            }
            return Effect.succeed(`array_${subResult}` as const);
          })
        );
      }
      if (type.isObject()) {
        const toJSONProperty = type.getProperty('toJSON');
        if (toJSONProperty !== undefined) {
          if (!propertyIsFunction(toJSONProperty)) {
            return Effect.fail(
              new TypeNotSupportedError(node, 'object contains property "toJSON" which isn\'t a function', position)
            );
          }

          const signatures = toJSONProperty.getTypeAtLocation(node).getCallSignatures();
          if (signatures.length === 0) {
            return Effect.fail(
              new TypeNotSupportedError(
                node,
                'object contains function "toJSON", but signature cannot be inferred',
                position
              )
            );
          }
          return pipe(
            signatures,
            ReadonlyArray.map(signature => signature.getReturnType()),
            types =>
              types.length === 1 && types[0] !== undefined
                ? types[0]
                : ({
                    fakeUnionOrIntersectionType: true,
                    types,
                    join: 'union',
                  } satisfies FakeUnionOrIntersectionType),
            parser
          );
        }

        return pipe(
          type,
          // {a: number, b: boolean}
          type => type.getProperties(),
          // [Symbol, Symbol]
          ReadonlyArray.map(property =>
            Tuple.tuple(property.getName(), propertyIsFunction(property) ? undefined : property.getTypeAtLocation(node))
          ),
          // [['a', Type], ['b', Type], ['b', undefined]]
          ReadonlyArray.filter((tuple): tuple is [string, Type] =>
            pipe(tuple, Tuple.getSecond, type => type !== undefined)
          ),
          // [['a', Type], ['b', Type]]
          ReadonlyArray.map(Tuple.mapSecond(parser)),
          // [['a', Effect<..., ..., 'number'>], ['b', Effect<..., ..., 'boolean'>]]
          ReadonlyArray.map(([name, effect]) => Effect.map(effect, result => Tuple.tuple(name, result))),
          // [Effect<..., ..., ['a', 'number']>, Effect<..., ..., ['b', 'boolean']>]
          Effect.all,
          // Effect<..., ..., [['a', 'number'], ['b', 'boolean']]>
          Effect.flatMap(propertiesAndParserResults => {
            let first: (typeof propertiesAndParserResults)[0] | undefined = undefined;
            for (const [name, result] of propertiesAndParserResults) {
              if (first === undefined) {
                first = [name, result];
              } else if (result !== first[1]) {
                return Effect.fail(
                  new TypeNotSupportedError(
                    node,
                    `object values containing different types (${first[0]}=${first[1]} and ${name}=${result})`,
                    position
                  )
                );
              }
            }
            if (first === undefined) {
              return Effect.fail(new TypeNotSupportedError(node, 'empty object', position));
            }
            if (isObjectResult(first[1])) {
              return Effect.fail(
                new TypeNotSupportedError(node, `object (property ${first[0]}) containing subobject`, position)
              );
            }
            if (isArrayResult(first[1])) {
              return Effect.fail(
                new TypeNotSupportedError(node, `object (property ${first[0]}) containing array`, position)
              );
            }
            return Effect.succeed(`object_${first[1]}` satisfies ObjectParserResult);
          })
        );
      }
      return Effect.fail(new TypeInferenceFailedError(node, 'Type not identified by parser'));
    };

    return pipe(
      type,
      parser,
      Effect.map(result => ({ position, result }))
    );
  },
  parse: (serialized, context) => {
    const result = context.result;
    if (result === 'null' && ['null', '', encodeURIComponent('\0')].includes(serialized)) {
      return Effect.succeed(null);
    } else if (
      result === 'boolean' &&
      ['true', 'false', 'True', 'False', 'TRUE', 'FALSE', '1', '0'].includes(serialized)
    ) {
      return Effect.succeed(['true', 'True', 'TRUE', '1'].includes(serialized));
    } else if (result === 'string') {
      return pipe(serialized, decodeURIComponent, Effect.succeed);
    } else if (result === 'number') {
      const num = Number.parseFloat(serialized);
      if (!Number.isNaN(num)) {
        return Effect.succeed(num);
      }
    } else if (isObjectResult(result)) {
      if (serialized === '') {
        return Effect.succeed({});
      }
      return pipe(
        serialized,
        // "a%20",1,b,2,c,3
        String.split(','),
        // ['a%20', '1', 'b', '2', 'c', '3']
        (parts): Effect.Effect<never, HeaderParseError, string[]> => {
          if (parts.length <= 1) {
            return Effect.fail(new HeaderParseError(serialized, context, 'must contain comma'));
          }
          if (parts.length % 2 !== 0) {
            return Effect.fail(
              new HeaderParseError(serialized, context, 'must contain even number of comma-separated values')
            );
          }

          return Effect.succeed(parts);
        },
        // Effect<..., ..., ['a%20', '1', 'b', '2', 'c', '3']>
        Effect.map(
          ReadonlyArray.map((part, index) =>
            index % 2 === 0
              ? defaultImplementation.parse(part, { position: context.position, result: 'string' })
              : defaultImplementation.parse(part, { position: context.position, result: toBasicParserResult(result) })
          )
        ),
        // Effect<..., ..., [Effect<..., ..., 'a '>, Effect<..., ..., 1>, Effect<..., ..., 'b'>, Effect<..., ..., 2>, Effect<..., ..., 'c'>, Effect<..., ..., 3>]>
        Effect.map(Effect.all),
        // Effect<..., ..., Effect<..., ..., ['a ', 1, 'b', 2, 'c', 3]>>
        Effect.flatten,
        // Effect<..., ..., ['a ', 1, 'b', 2, 'c', 3]>
        Effect.map(parts => ReadonlyArray.chunksOf(parts, 2) as Array<[string, unknown]>),
        // Effect<..., ..., [['a ', 1], ['b', 2], ['c', 3]]>
        Effect.map(ReadonlyRecord.fromEntries)
        // Effect<..., ..., {'a ': 1, b: 2, c: 3}>
      );
    } else if (isArrayResult(result)) {
      if (serialized === '') {
        return Effect.succeed([]);
      }
      return pipe(
        serialized,
        // "a%20","b","c"
        String.split(','),
        // ['a%20', 'b', 'c']
        ReadonlyArray.map(part =>
          defaultImplementation.parse(part, { position: context.position, result: toBasicParserResult(result) })
        ),
        // [Effect<..., ..., 'a '>, Effect<..., ..., 'b'>, Effect<..., ..., 'c'>]>
        Effect.all
        // Effect<..., ...,['a ', 'b', 'c']>
      );
    }
    return Effect.fail(new HeaderParseError(serialized, context));
  },
  serialize: unserialized => {
    if (typeof unserialized === 'function') {
      return Effect.fail(new HeaderSerializeError('Functions cannot be serialized!'));
    }
    if (typeof unserialized === 'symbol') {
      return Effect.fail(new HeaderSerializeError('Symbols cannot be serialized!'));
    }

    if (unserialized === null || unserialized === undefined) {
      return Effect.succeed('');
    }

    if (Array.isArray(unserialized)) {
      return pipe(
        unserialized,
        // [1, {'c': true}, false]
        ReadonlyArray.map(defaultImplementation.serialize),
        // [Effect<..., ..., '1'>, Effect<..., ..., 'c,true'>, Effect<..., ..., 'false'>]
        Effect.all,
        // Effect<..., ..., ['1', 'c,true', 'false]>
        Effect.map(ReadonlyArray.map(encodeURIComponent)),
        // Effect<..., ..., ['1', 'c%2Ctrue', 'false]>
        Effect.map(ReadonlyArray.join(','))
        // Effect<..., ..., '1,c%2Ctrue,false'>
      );
    }

    if (typeof unserialized === 'object') {
      if ('toJSON' in unserialized) {
        return defaultImplementation.serialize(unserialized.toJSON());
      }

      return pipe(
        unserialized,
        // {a: 1, b: {c: true}, [Symbol()]: 'hidden'}
        ReadonlyRecord.toEntries,
        // [['a', 1], ['b', {'c': true}]]
        ReadonlyArray.flatten,
        // ['a', 1, 'b', {'c': true}]
        ReadonlyArray.map(defaultImplementation.serialize),
        // [Effect<..., ..., 'a'>, Effect<..., ..., '1'>, Effect<..., ..., 'b'>, Effect<..., ..., 'c,>true']
        Effect.all,
        // Effect<..., ..., ['a', '1', 'b', 'c,true']>
        Effect.map(ReadonlyArray.map(encodeURIComponent)),
        // Effect<..., ..., ['a', '1', 'b', 'c%2Ctrue']>
        Effect.map(ReadonlyArray.join(','))
        // Effect<..., ..., 'a,1,b,c%2Ctrue'>
      );
    }

    if (typeof unserialized === 'boolean') {
      return Effect.succeed(unserialized ? 'true' : 'false');
    }

    if (typeof unserialized === 'number') {
      if (Number.isNaN(unserialized)) {
        return Effect.fail(new HeaderSerializeError('Number "NaN" cannot be serialized!'));
      }

      return pipe(unserialized, JSON.stringify, Effect.succeed);
    }

    //string
    return pipe(unserialized, encodeURIComponent, Effect.succeed);
  },
};
export const headerIoServiceDefaultImplementation = Effect.provideService(
  headerIoService,
  headerIoService.of(defaultImplementation)
);
