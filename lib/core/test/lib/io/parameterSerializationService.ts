import test from 'ava';
import {
  parameterSerializationService,
  parameterSerializationServiceDefaultImplementation,
  SerializationStrategy
} from "../../../lib/io/parameterSerializationService";
import {Cause, Effect, Exit} from "effect";
import {jsonIoService, jsonIoServiceDefaultImplementation} from "../../../lib/io/jsonIoService";
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

type ExpectedError = {errorClass: string, message: string};
type Result = string | ExpectedError;
type Input = {strategy: SerializationStrategy, expectedResult: Result};
type Inputs = Array<Input>;
const inputs = (options: Result | {json: Result, other: Result} | {json: Result, explode: Result, notExplode: Result}): Inputs => {
  if (typeof  options === 'string' || 'errorClass' in options) {
    return inputs({json: options, explode: options, notExplode: options});
  }
  if ('other' in options) {
    return inputs({json: options.json, explode: options.other, notExplode: options.other});
  }
  return [
    {strategy: {content: 'application/json'}, expectedResult: options.json},
    {strategy: {style: 'form', explode: true}, expectedResult: options.explode},
    {strategy: {style: 'simple', explode: true}, expectedResult: options.explode},
    {strategy: {style: 'simple', explode: false}, expectedResult: options.notExplode},
    {strategy: {style: 'form', explode: false}, expectedResult: options.notExplode},
  ];
}
enum STRING_ENUM { A = "A", B = "B" };
enum NUMBERED_ENUM { A = 2, B = 4 };
enum INDEXED_ENUM { A, B };

const testCases: Array<[any, Inputs]> = [
  [1, inputs('1')],
  [1.2, inputs('1.2')],
  [-1, inputs('-1')],
  ['-1.2', inputs({json: '"-1.2"', other: '-1.2'})],
  [Number.NaN, inputs({json: 'null', other: {errorClass: 'ParameterSerializeError', message: 'Number "NaN" cannot be serialized!'}})],
  [Number.POSITIVE_INFINITY, inputs({json: 'null', other: {errorClass: 'ParameterSerializeError', message: 'Infinite number cannot be serialized!'}})],
  [Number.NEGATIVE_INFINITY, inputs({json: 'null', other: {errorClass: 'ParameterSerializeError', message: 'Infinite number cannot be serialized!'}})],
  [[1,1.2,-1,-1.2], inputs({json: '[1,1.2,-1,-1.2]', other: '1,1.2,-1,-1.2'})],
  [[1,Number.NaN], inputs({json: '[1,null]', other: {errorClass: 'ParameterSerializeError', message: 'Number "NaN" cannot be serialized!'}})],
  [[1,Number.POSITIVE_INFINITY], inputs({json: '[1,null]', other:{errorClass: 'ParameterSerializeError', message: 'Infinite number cannot be serialized!'}})],
  [[1,Number.NEGATIVE_INFINITY], inputs({json: '[1,null]', other: {errorClass: 'ParameterSerializeError', message: 'Infinite number cannot be serialized!'}})],
  [true, inputs('true')],
  [true, inputs('true')],
  [false, inputs('false')],
  [new Date("2000-01-01T00:00:00.000Z"), inputs({json: '"2000-01-01T00:00:00.000Z"', other: '2000-01-01T00:00:00.000Z'})],
  [new Date("2000-01-01T00:00:00.000Z"), inputs({json: '"2000-01-01T00:00:00.000Z"', other: '2000-01-01T00:00:00.000Z'})],
  [[true,false], inputs({json: '[true,false]', other: 'true,false'})],
  ["str", inputs({json: '"str"', other: 'str'})],
  [[["str","a"],["str","b"]], inputs({json: '[["str","a"],["str","b"]]', other: 'str,a,str,b'})],
  [["a",1], inputs({json: '["a",1]', other: 'a,1'})],
  [{"a":"a",b:1,c:"c"}, inputs({json: '{"a":"a","b":1,"c":"c"}', explode: 'a=a,b=1,c=c', notExplode: 'a,a,b,1,c,c'})],
  [{"a":"a",b:{c: 1,d:"d"}}, inputs({json: '{"a":"a","b":{"c":1,"d":"d"}}', explode: 'a=a,b=c=1,d=d', notExplode: 'a,a,b,c,1,d,d'})],
  [STRING_ENUM.A, inputs({json: '"A"', other: 'A'})],
  [NUMBERED_ENUM.A, inputs('2')],
  [INDEXED_ENUM.A, inputs('0')],
];

testCases.forEach(([value, strategies], i) =>
  strategies.forEach((input, j) =>
    test(`${i}.${j}`, t => {
      Effect.all({jsonIoService, parameterSerializationService})
        .pipe(
          Effect.flatMap(({parameterSerializationService}) => parameterSerializationService.serialize(value, input.strategy)),
          jsonIoServiceDefaultImplementation,
          parameterSerializationServiceDefaultImplementation,
          assumeAllServicesProvided,
          Effect.runSyncExit,
          result => {
            if (Exit.isFailure(result)) {
              const errors = Array.from(Cause.failures(result.cause));
              if (typeof input.expectedResult === 'string') {
                t.fail(JSON.stringify(errors));
                return;
              }
              t.is(errors.length, 1)
              t.not(errors[0], undefined);
              t.is(errors[0]!.exactErrorName, input.expectedResult.errorClass);
              t.is(errors[0]!.message, input.expectedResult.message);
              return;
            }
            const actualResult = result.value;
            if (typeof input.expectedResult === 'string') {
              t.is(actualResult, input.expectedResult);
              return;
            }
            t.fail(actualResult);
          }
        )
    })
  )
)
