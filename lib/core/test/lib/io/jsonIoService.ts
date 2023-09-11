import test from 'ava';
import { jsonIoService, jsonIoServiceDefaultImplementation } from '../../../lib/io/jsonIoService';
import { Cause, Effect, Exit } from 'effect';
import { JsonSerializeError } from '../../../lib/errors/JsonSerializeError';
import { JsonParseError } from '../../../lib/errors/JsonParseError';

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
      Effect.runSync
    );

    t.is(result, json);
  });

  test(`parse: ${testName}`, t => {
    const result = jsonIoService.pipe(
      Effect.flatMap(jsonIoService => jsonIoService.parse(json)),
      jsonIoServiceDefaultImplementation,
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
    Effect.runSyncExit
  );

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.is(errors.length, 1);
    t.not(errors[0], undefined);
    t.true(errors[0] instanceof JsonParseError);
    t.is(errors[0]!.message, 'Unterminated string in JSON at position 16');
  } else {
    t.fail();
  }
});
