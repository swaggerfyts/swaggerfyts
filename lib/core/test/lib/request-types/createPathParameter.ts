import test from 'ava';
import { createPathParameter } from '../../../lib/request-types/createPathParameter';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = createPathParameter<number, 'asdf'>();
  expectTypeOf(num).toBeNumber();

  const bool = createPathParameter<boolean, 'asdf'>();
  expectTypeOf(bool).toBeBoolean();

  const str = createPathParameter<string, 'asdf'>();
  expectTypeOf(str).toBeString();

  const arr = createPathParameter<string[], 'asdf'>();
  expectTypeOf(arr).toBeArray();
  expectTypeOf(arr).items.toBeString();

  const obj = createPathParameter<{ a: 1; b: '2'; c: 3 }, 'asdf'>();
  expectTypeOf(obj).toBeObject();
  expectTypeOf(obj)
    .toHaveProperty('a')
    .toEqualTypeOf(1 as const);
  expectTypeOf(obj)
    .toHaveProperty('b')
    .toEqualTypeOf('2' as const);
  expectTypeOf(obj)
    .toHaveProperty('c')
    .toEqualTypeOf(3 as const);

  t.pass();
});
