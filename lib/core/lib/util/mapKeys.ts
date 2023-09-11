/* eslint-disable @typescript-eslint/no-explicit-any, ts-immutable/immutable-data, @typescript-eslint/no-unsafe-assignment, security/detect-object-injection */

import { Function } from 'effect';

/**
 * Maps a `ReadonlyRecord` into another `Record` by applying a transformation function to each of its keys.
 * Note that due to limitations with typescript, this operation looses some of the available type information. E.g.:
 *
 * map({ a: 1, b: 2 }, k => `prefix_${k}`); // type is { "prefix_a": 1 | 2, "prefix_b": 1 | 2 }
 *
 * This is even worse when currying:
 *
 * map(k => `prefix_${k}`)({ a: 1, b: 2 }); // type is Record<`prefix_${string}`, 1 | 2>
 *
 * @param self - The `ReadonlyRecord` to be mapped.
 * @param f - S transformation function that will be applied to each of the keys in the `ReadonlyRecord`.
 *
 * @example
 * import { map } from "@effect/data/ReadonlyRecord"
 *
 * const f = (key: string) => `${key}1`
 *
 * assert.deepStrictEqual(mapKey({ a: 2, b: 5 }, f), { a1: 2, b1: 5 })
 *
 * @since 1.0.0
 */

export const mapKey: {
  <KOld extends string, KNew extends string>(
    f: (key: KOld) => KNew
  ): <const R extends Record<KOld, any>>(
    self: R
  ) => {
    [key in keyof R as KNew]: R[key];
  };
  <const R extends Record<string, any>, KNew extends string>(
    self: R,
    f: (key: keyof R) => KNew
  ): {
    [key in keyof R as KNew]: R[key];
  };
} = Function.dual(2, <const R extends Record<string, any>, KNew extends string>(self: R, f: (key: keyof R) => KNew) => {
  const out: Record<string, R[keyof R]> = {};
  for (const key of Object.keys(self)) {
    out[f(key)] = self[key];
  }
  return out;
});
