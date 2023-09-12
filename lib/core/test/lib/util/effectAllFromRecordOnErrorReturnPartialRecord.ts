import test from 'ava';
import { Cause, Effect, Exit, pipe, ReadonlyRecord } from 'effect';
import {
  EffectAllFromRecordOnErrorReturnPartialRecord,
  effectAllFromRecordOnErrorReturnPartialRecord,
} from '../../../lib/util/effectAllFromRecordOnErrorReturnPartialRecord';
import { expectTypeOf } from 'expect-type';

test('all success', t => {
  const input = {
    a: Effect.succeed(1 as const),
    b: Effect.succeed(2 as const),
    c: Effect.succeed(3 as const),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<Effect.Effect<never, never, { a: 1; b: 2; c: 3 }>>();

  const result = Effect.runSync(resultEffect);
  expectTypeOf(result).toHaveProperty('a').toMatchTypeOf<1>();
  expectTypeOf(result).toHaveProperty('b').toMatchTypeOf<2>();
  expectTypeOf(result).toHaveProperty('c').toMatchTypeOf<3>();

  t.deepEqual(result, { a: 1, b: 2, c: 3 });
});

test('one fails', t => {
  const input = {
    a: Effect.fail(1 as const),
    b: Effect.succeed(2 as const),
    c: Effect.succeed(3 as const),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<Effect.Effect<never, { a: 1 }, never>>();

  const result = Effect.runSyncExit(resultEffect);

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.deepEqual(errors, [{ a: 1 }]);
    expectTypeOf(errors).toMatchTypeOf<Array<{ a: 1 }>>();
  } else {
    t.fail();
  }
});

test('all fail', t => {
  const input = {
    a: Effect.fail(1 as const),
    b: Effect.fail(2 as const),
    c: Effect.fail(3 as const),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<Effect.Effect<never, { a: 1; b: 2; c: 3 }, never>>();

  const result = Effect.runSyncExit(resultEffect);

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.deepEqual(errors, [{ a: 1, b: 2, c: 3 }]);
    expectTypeOf(errors).toMatchTypeOf<Array<{ a: 1; b: 2; c: 3 }>>();
  } else {
    t.fail();
  }
});

test('random', t => {
  const aSucceeds = Math.random() < 0.5;
  const bSucceeds = Math.random() < 0.5;
  const cSucceeds = Math.random() < 0.5;

  const input = {
    a: aSucceeds ? Effect.succeed(1 as const) : Effect.fail(1 as const),
    b: bSucceeds ? Effect.succeed(2 as const) : Effect.fail(2 as const),
    c: cSucceeds ? Effect.succeed(3 as const) : Effect.fail(3 as const),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<Effect.Effect<never, { a?: 1; b?: 2; c?: 3 }, { a: 1; b: 2; c: 3 }>>();

  const result = Effect.runSyncExit(resultEffect);

  if (Exit.isFailure(result)) {
    const errors = Array.from(Cause.failures(result.cause));
    t.deepEqual(errors, [
      {
        ...(aSucceeds ? {} : { a: 1 }),
        ...(bSucceeds ? {} : { b: 2 }),
        ...(cSucceeds ? {} : { c: 3 }),
      },
    ]);
    expectTypeOf(errors).toMatchTypeOf<Array<{ a?: 1; b?: 2; c?: 3 }>>();
  } else {
    const success = result.value;
    expectTypeOf(success).toMatchTypeOf<{ a: 1; b: 2; c: 3 }>();
    t.deepEqual(success, { a: 1, b: 2, c: 3 });
  }
});

test('error union', t => {
  const input = {
    a: Effect.succeed(1) as Effect.Effect<never, 'a' | 'b', 1>,
    b: Effect.succeed(2) as Effect.Effect<never, 'a' | 'b', 2>,
    c: Effect.succeed(3) as Effect.Effect<never, 'a' | 'b', 3>,
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<
    Effect.Effect<never, { a?: 'a' | 'b'; b?: 'a' | 'b'; c?: 'a' | 'b' }, { a: 1; b: 2; c: 3 }>
  >();

  const result = Effect.runSync(resultEffect);
  expectTypeOf(result).toHaveProperty('a').toMatchTypeOf<1>();
  expectTypeOf(result).toHaveProperty('b').toMatchTypeOf<2>();
  expectTypeOf(result).toHaveProperty('c').toMatchTypeOf<3>();

  t.deepEqual(result, { a: 1, b: 2, c: 3 });
});

test('with Record<string', t => {
  const input: Record<string, Effect.Effect<never, 'a' | 'b', number>> = {
    a: Effect.succeed(1),
    b: Effect.succeed(2),
    c: Effect.succeed(3),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<
    Effect.Effect<never, Record<string, 'a' | 'b' | undefined>, Record<string, number>>
  >();

  const result = Effect.runSync(resultEffect);
  expectTypeOf(result).toHaveProperty('a').toBeNumber();
  expectTypeOf(result).toHaveProperty('b').toBeNumber();
  expectTypeOf(result).toHaveProperty('c').toBeNumber();

  t.deepEqual(result, { a: 1, b: 2, c: 3 });
});

test('with Record<"a" | "b" | "c"', t => {
  const input: Record<'a' | 'b' | 'c', Effect.Effect<never, 'a' | 'b', number>> = {
    a: Effect.succeed(1),
    b: Effect.succeed(2),
    c: Effect.succeed(3),
  };

  const resultEffect = effectAllFromRecordOnErrorReturnPartialRecord(input);
  expectTypeOf(resultEffect).toMatchTypeOf<
    Effect.Effect<never, Partial<Record<'a' | 'b' | 'c', 'a' | 'b' | undefined>>, Record<'a' | 'b' | 'c', number>>
  >();

  const result = Effect.runSync(resultEffect);
  expectTypeOf(result).toHaveProperty('a').toBeNumber();
  expectTypeOf(result).toHaveProperty('b').toBeNumber();
  expectTypeOf(result).toHaveProperty('c').toBeNumber();

  t.deepEqual(result, { a: 1, b: 2, c: 3 });
});

test('with generic', t => {
  const generateResultEffect = <K extends string>(
    obj: Record<K, number>
  ): EffectAllFromRecordOnErrorReturnPartialRecord<Record<K, Effect.Effect<never, never, number>>> =>
    pipe(
      obj,
      ReadonlyRecord.map(v => Effect.succeed(v)),
      effectAllFromRecordOnErrorReturnPartialRecord
    );

  const resultEffect = generateResultEffect({ a: 1, b: 2, c: 3 });
  expectTypeOf(resultEffect).toMatchTypeOf<Effect.Effect<never, never, Record<'a' | 'b' | 'c', number>>>();

  const result = Effect.runSync(resultEffect);
  expectTypeOf(result).toHaveProperty('a').toBeNumber();
  expectTypeOf(result).toHaveProperty('b').toBeNumber();
  expectTypeOf(result).toHaveProperty('c').toBeNumber();

  t.deepEqual(result, { a: 1, b: 2, c: 3 });
});
