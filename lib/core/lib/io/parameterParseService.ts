import { Context, Effect, pipe, ReadonlyArray, ReadonlyRecord, String, Tuple } from 'effect';
import { ParameterParseError } from '../errors/ParameterParseError';
import { FakeUnionOrIntersectionType } from '../../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';
import { Node, Type } from 'ts-morph';
import { TypeNotSupportedError } from '../../compiler-plugin/errors/TypeNotSupportedError';
import { isFakeUnionOrIntersectionType } from '../../compiler-plugin/request-types/util/isFakeUnionOrIntersectionType';
import { TypeInferenceFailedError } from '../../compiler-plugin/errors/TypeInferenceFailedError';
import { CompilerPluginError } from '../../compiler-plugin/errors/CompilerPluginError';
import { propertyIsFunction } from '../../compiler-plugin/util/propertyIsFunction';
import * as querystring from 'querystring';
import { RequestDoesNotContainError } from '../errors/RequestDoesNotContainError';
import { mapKey } from '../util/mapKeys';
import {
  effectAllFromRecordOnErrorReturnPartialRecord,
  EffectAllFromRecordOnErrorReturnPartialRecord,
} from '../util/effectAllFromRecordOnErrorReturnPartialRecord';
import {ParameterSerializationStrategies} from "./util/ParameterSerializationStrategies";

export type ParameterPosition = 'query parameter' | 'path parameter' | 'header' | 'cookie';

/**
 * Parse parameters service. Parsing works as follows:
 * 1) For each type that needs to be parsed, the compiler api will create ParseContext, by calling "getParseContext".
 * 2) The parsing context is then given to the parse functions when parsing.
 * Each implementation of this service must describe what serialization strategies are supported. See
 * https://swagger.io/docs/specification/serialization/ for a description of the available options.
 */
export interface ParameterParseServiceType<ParseContext> {
  readonly supportedSerializationStrategies: ParameterSerializationStrategies;
  readonly getParserContext: (
    position: ParameterPosition,
    type: Type | FakeUnionOrIntersectionType,
    node: Node
  ) => Effect.Effect<unknown, CompilerPluginError, ParseContext>;
  readonly parse: (
    serialized: string,
    parseContext: ParseContext
  ) => Effect.Effect<unknown, ParameterParseError, unknown>;
  readonly parseQueryParameters: <const Keys extends string>(
    rawQueryString: string,
    paramNamesAndContext: Record<Keys, ParseContext>
  ) => EffectAllFromRecordOnErrorReturnPartialRecord<
    Record<Keys, Effect.Effect<unknown, ParameterParseError | RequestDoesNotContainError, unknown>>
  >;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parameterParseService = Context.Tag<ParameterParseServiceType<any>>();

type PrimitiveParserResult = 'null' | 'boolean' | 'string' | 'number';
type ArrayParserResult = `array_${PrimitiveParserResult}`;
type ObjectParserResult = `object_${PrimitiveParserResult}`;
type ParserResult = PrimitiveParserResult | ArrayParserResult | ObjectParserResult;
const isArrayResult = (i: ParserResult): i is ArrayParserResult => i.startsWith('array_');
const isObjectResult = (i: ParserResult): i is ObjectParserResult => i.startsWith('object_');
const toPrimitiveParserResult = (i: ArrayParserResult | ObjectParserResult) =>
  (isArrayResult(i) ? i.substring('array_'.length) : i.substring('object_'.length)) as PrimitiveParserResult;

type DefaultParseContext = { position: ParameterPosition; result: ParserResult };
const defaultImplementation: ParameterParseServiceType<DefaultParseContext> = {
  supportedSerializationStrategies: {
    pathParameter: {
      primitive: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
      ],
      array: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
      ],
      object: [
        {
          style: 'simple',
          explode: true,
        },
        {
          style: 'simple',
          explode: false,
        },
      ],
    },
    queryParameter: {
      primitive: [
        {
          style: 'form',
          explode: false,
        },
        {
          style: 'form',
          explode: true,
        },
      ],
      array: [
        {
          style: 'form',
          explode: false,
        },
        {
          style: 'form',
          explode: true,
        },
        {
          style: 'spaceDelimited',
          explode: true,
        },
        {
          style: 'pipeDelimited',
          explode: true,
        },
      ],
      object: [
        {
          style: 'deepObject',
          explode: true,
        },
        {
          style: 'form',
          explode: false,
        },
      ],
    },
    header: {
      primitive: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
      ],
      array: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
      ],
      object: [
        {
          style: 'simple',
          explode: true,
        },
        {
          style: 'simple',
          explode: false,
        },
      ],
    },
    cookie: {
      primitive: [
        {
          style: 'form',
          explode: false,
        },
        {
          style: 'form',
          explode: true,
        },
      ],
      array: [
        {
          style: 'form',
          explode: false,
        },
      ],
      object: [
        {
          style: 'form',
          explode: false,
        },
      ],
    },
  },
  getParserContext: (position, type, node) => {
    const parser = (
      type: Type | FakeUnionOrIntersectionType
    ): Effect.Effect<unknown, CompilerPluginError, ParserResult> => {
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
              if (position === 'query parameter') {
                if (name.includes('[')) {
                  return Effect.fail(
                    new TypeNotSupportedError(
                      node,
                      'To enable compatibility with the "deepObject" serialization style, object property keys containing "[" are',
                      position
                    )
                  );
                }
                if (name.includes(']')) {
                  return Effect.fail(
                    new TypeNotSupportedError(
                      node,
                      'To enable compatibility with the "deepObject" serialization style, object property keys containing "]" are',
                      position
                    )
                  );
                }
              }

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
      return pipe(serialized, String.trim, decodeURIComponent, Effect.succeed);
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
        parts => {
          if (parts.every(part => part.includes('=') || part.includes(encodeURIComponent('=')))) {
            //we assume style is key0=value0,key1=value1,key2=value2
            return pipe(
              parts,
              // ['a%20=1', 'b=2', 'c=3']
              ReadonlyArray.map(part => {
                if (!part.includes('=')) {
                  part = part.replace(encodeURIComponent('='), '='); //this only replaces the first occurrence!
                }
                const positionEquals = part.indexOf('='); //position of first =
                return Tuple.tuple(part.substring(0, positionEquals), part.substring(positionEquals + 1));
              }),
              // [['a%20', '1'], ['b','2'], ['c','3']]
              ReadonlyArray.map(
                Tuple.mapBoth({
                  onFirst: key =>
                    defaultImplementation.parse(key, { position: context.position, result: 'string' }) as Effect.Effect<
                      never,
                      ParameterParseError,
                      string
                    >,
                  onSecond: value =>
                    defaultImplementation.parse(value, {
                      position: context.position,
                      result: toPrimitiveParserResult(result),
                    }),
                })
              ),
              // [[Effect<..., ..., 'a%20'>,  Effect<..., ..., 1>], [Effect<..., ..., 'b'>, Effect<..., ..., 2>], [Effect<..., ..., 'c'>, Effect<..., ..., 3>]]
              ReadonlyArray.map(tuple => Effect.all(tuple)),
              // [Effect<..., ..., ['a%20', 1]>, Effect<..., ..., ['b', 2]>, Effect<..., ..., ['c', 3]>]
              Effect.all,
              // Effect<..., ..., [['a%20', '1'], ['b','2'], ['c','3']]>
              Effect.map(ReadonlyRecord.fromEntries)
              // Effect<..., ..., {'a ': 1, b: 2, c: 3}>
            );
          } else {
            //we assume style is key0,value0,key1,value1,key2,value2
            if (parts.length <= 1) {
              return Effect.fail(new ParameterParseError(serialized, context, 'must contain comma'));
            }
            if (parts.length % 2 !== 0) {
              return Effect.fail(
                new ParameterParseError(serialized, context, 'must contain even number of comma-separated values')
              );
            }

            return pipe(
              parts,
              // ['a%20', '1', 'b', '2', 'c', '3']
              ReadonlyArray.map((part, index) =>
                index % 2 === 0
                  ? defaultImplementation.parse(part, { position: context.position, result: 'string' })
                  : defaultImplementation.parse(part, {
                      position: context.position,
                      result: toPrimitiveParserResult(result),
                    })
              ),
              // [Effect<..., ..., 'a '>, Effect<..., ..., 1>, Effect<..., ..., 'b'>, Effect<..., ..., 2>, Effect<..., ..., 'c'>, Effect<..., ..., 3>]
              Effect.all,
              // Effect<..., ..., ['a ', 1, 'b', 2, 'c', 3]>
              Effect.map(parts => ReadonlyArray.chunksOf(parts, 2) as Array<[string, unknown]>),
              // Effect<..., ..., [['a ', 1], ['b', 2], ['c', 3]]>
              Effect.map(ReadonlyRecord.fromEntries)
              // Effect<..., ..., {'a ': 1, b: 2, c: 3}>
            );
          }
        }
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
          defaultImplementation.parse(part, { position: context.position, result: toPrimitiveParserResult(result) })
        ),
        // [Effect<..., ..., 'a '>, Effect<..., ..., 'b'>, Effect<..., ..., 'c'>]>
        Effect.all
        // Effect<..., ...,['a ', 'b', 'c']>
      );
    }
    return Effect.fail(new ParameterParseError(serialized, context));
  },
  parseQueryParameters: (rawQueryString, paramNamesAndContext) => {
    if (rawQueryString.startsWith('?')) {
      rawQueryString = rawQueryString.substring(1);
    }

    //at this point, we only want to decode the query param keys, not the values. This way we can reuse the "parse" implementation
    const parsedQueryArgs = pipe(
      querystring.parse(rawQueryString, undefined, undefined, { decodeURIComponent: s => s }),
      mapKey(k => pipe(k, String.trim, decodeURIComponent))
    );

    return pipe(
      paramNamesAndContext,
      ReadonlyRecord.map(
        (context, name): Effect.Effect<never, ParameterParseError | RequestDoesNotContainError, unknown> => {
          const unexpectedArrayFailure = (param: string[], fullName: string) => {
            const input = `?${fullName}=${param.join(`&${fullName}=`)}`;
            return Effect.fail(new ParameterParseError(input, context, 'no duplicate values allowed'));
          };

          const result = context.result;
          const rawParam = parsedQueryArgs[name]; //eslint-disable-line security/detect-object-injection

          if (rawParam === undefined) {
            if (isObjectResult(result)) {
              //we now assume style = deepObject
              return pipe(
                parsedQueryArgs,
                // { a: '1', 'b[c]': '2', 'b[d]': '3', b[e]: undefined}
                ReadonlyRecord.filter(
                  (value, key): value is Exclude<typeof value, undefined> =>
                    value !== undefined && key.startsWith(`${name}[`) && key.endsWith(']')
                ),
                // { 'b[c]': '2', 'b[d]': '3'}
                mapKey(k => k.substring(`${name}[`.length, k.length - 1)),
                // { 'c': '2', 'd': '3'}
                ReadonlyRecord.map((param, subName) => {
                  if (Array.isArray(param)) {
                    const fullQueryParamName = `${name}[${subName}]`;
                    return unexpectedArrayFailure(param, fullQueryParamName);
                  }
                  return defaultImplementation.parse(param, {
                    position: context.position,
                    result: toPrimitiveParserResult(result),
                  });
                }),
                // { 'c': Effect<..., ..., 2>, 'd': Effect<..., ..., 3>}
                Effect.all
                // Effect<..., ..., { 'c': 2, 'd': 3}>
              );
            }
            return Effect.fail(new RequestDoesNotContainError('query parameter', name));
          }

          if (Array.isArray(rawParam)) {
            if (!isArrayResult(result)) {
              return unexpectedArrayFailure(rawParam, name);
            }

            return pipe(
              rawParam,
              // ['1', '2', '3']
              ReadonlyArray.map(part =>
                defaultImplementation.parse(part, {
                  position: context.position,
                  result: toPrimitiveParserResult(result),
                })
              ),
              // [Effect<..., ..., 1>, Effect<..., ..., 2>, Effect<..., ..., 3>]
              Effect.all
              // Effect<..., ..., [1, 2, 3]>
            );
          }

          return defaultImplementation.parse(rawParam, context);
        }
      ),
      effectAllFromRecordOnErrorReturnPartialRecord
    );
  },
};
export const parameterIoServiceDefaultImplementation = Effect.provideService(
  parameterParseService,
  parameterParseService.of(defaultImplementation)
);
