/* eslint-disable @typescript-eslint/no-explicit-any, ts-immutable/immutable-data, @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-return */

import { Effect, pipe, ReadonlyArray } from 'effect';
import { Evaluate } from './Evaluate';

type R<O> = O extends Effect.Effect<infer R, any, any> ? R : never;
type E<O> = O extends Effect.Effect<any, infer E, any> ? E : never;
type S<O> = O extends Effect.Effect<any, any, infer S> ? S : never;

type AllEffectsThatCanNotSucceed<O extends Record<string, Effect.Effect<any, any, any>>> = {
  [key in keyof O as S<O[key]> extends never ? key : never]: E<O[key]>;
};

export const effectAllFromRecordOnErrorReturnPartialRecord = <
  const O extends { [key: string]: Effect.Effect<any, any, any> },
>(
  self: O
): Effect.Effect<
  R<O[keyof O]>,
  E<O[keyof O]> extends never
    ? never
    : Evaluate<
        {
          [key in keyof O as S<O[key]> extends never ? never : E<O[key]> extends never ? never : key]?: E<O[key]>;
        } & AllEffectsThatCanNotSucceed<O>
      >,
  [keyof AllEffectsThatCanNotSucceed<O>] extends [never] ? { [key in keyof O]: S<O[key]> } : never
> => {
  const keys = Object.keys(self) as Array<keyof O>;

  // @ts-ignore
  return pipe(
    self,
    // {a: Effect<..., ..., 1>, b: Effect<..., Error, ...>, c: Effect<..., ..., 3>}
    v => Object.values(v),
    // [ Effect<..., ..., 1>, Effect<..., Error, ...>, Effect<..., ..., 3>]
    ReadonlyArray.map(
      Effect.mapBoth({
        onFailure: value => ({ failed: true as const, value }),
        onSuccess: value => ({ failed: false as const, value }),
      })
    ),
    // [ Effect<..., ..., { failed: false, result: 1 }>, Effect<..., { failed: true, result: Error }, ...>, Effect<..., ..., { failed: false, result: 3 }>]
    ReadonlyArray.map(Effect.merge),
    // [ Effect<..., never, { failed: false, result: 1 }>, Effect<..., never, { failed: true, result: Error }>, Effect<..., never, { failed: false, result: 3 }>]
    Effect.all,
    // Effect<..., never, [{ failed: false, result: 1 }, { failed: true, result: Error }, { failed: false, result: 3 }]>
    Effect.flatMap(results => {
      let hasFailed = false;
      const errors = {} as Partial<{ [key in keyof O]: E<O[key]> }>;
      const successes = {} as { [key in keyof O]: S<O[key]> };

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result === undefined) {
          continue;
        }
        if (result.failed) {
          errors[keys[i]!] = result.value;
          hasFailed = true;
        } else if (!hasFailed) {
          successes[keys[i]!] = result.value;
        }
      }
      return hasFailed ? Effect.fail(errors) : Effect.succeed(successes);
    })
    // Effect<..., {b: Error}, ...>
  );
};

export type EffectAllFromRecordOnErrorReturnPartialRecord<O extends { [key: string]: Effect.Effect<any, any, any> }> =
  ReturnType<typeof effectAllFromRecordOnErrorReturnPartialRecord<O>>;
