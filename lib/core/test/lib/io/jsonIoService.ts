import test from 'ava';
import { jsonIoService, jsonIoServiceDefaultImplementation } from '../../../lib/io/jsonIoService';
import { Cause, Effect, Exit } from 'effect';
import { JsonSerializeError } from '../../../lib/errors/JsonSerializeError';
import { JsonParseError } from '../../../lib/errors/JsonParseError';
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

const testCases: Array<[string, unknown, string]> = [
  ['string', 'str', '"str"'],
  ['object', { a: 1, b: 2 }, '{"a":1,"b":2}'],
  ['boolean', true, 'true'],
  ['null', null, 'null'],
  ['number', 1.23, '1.23'],
  ['array', [1, 2, 3, 4, 5], '[1,2,3,4,5]'],
];
testCases.forEach(([testName, input, json]) => {
  test(`serialize: ${testName}`, t => {
    const result = jsonIoService.pipe(
      Effect.flatMap(jsonIoService => jsonIoService.serialize(input)),
      jsonIoServiceDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSync
    );

    t.is(result, json);
  });

  test(`parse: ${testName}`, t => {
    const result = jsonIoService.pipe(
      Effect.flatMap(jsonIoService => jsonIoService.parse(json)),
      jsonIoServiceDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSync
    );

    t.deepEqual(result, input);
  });
});

test('serialize: follows .toJSON function', t => {
  const date = new Date();

  const result = jsonIoService.pipe(
    Effect.flatMap(jsonIoService => jsonIoService.serialize(date)),
    jsonIoServiceDefaultImplementation,
    assumeAllServicesProvided,
    Effect.runSync
  );

  t.is(result, `"${date.toJSON()}"`);
});

test('serialize: fail', t => {
  const input: Record<string, unknown> = { a: true };
  input['input'] = input; //eslint-disable-line ts-immutable/immutable-data

  const result = jsonIoService.pipe(
    Effect.flatMap(jsonIoService => jsonIoService.serialize(input)),
    jsonIoServiceDefaultImplementation,
    assumeAllServicesProvided,
    Effect.runSyncExit
  );

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.is(errors.length, 1);
    t.not(errors[0], undefined);
    t.true(errors[0] instanceof JsonSerializeError);
    t.true(errors[0]!.message.startsWith('Converting circular structure to JSON'));
  } else {
    t.fail();
  }
});

test('parse: fail', t => {
  const result = jsonIoService.pipe(
    Effect.flatMap(jsonIoService => jsonIoService.parse('"unclosed string')),
    jsonIoServiceDefaultImplementation,
    assumeAllServicesProvided,
    Effect.runSyncExit
  );

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.is(errors.length, 1);
    t.not(errors[0], undefined);
    t.true(errors[0] instanceof JsonParseError);
    //for some reason, either one of these messages is returned. This statement avoids this test becoming flaky
    t.true(['Unterminated string in JSON at position 16', 'Unexpected end of JSON input'].includes(errors[0]!.message));
  } else {
    t.fail();
  }
});
