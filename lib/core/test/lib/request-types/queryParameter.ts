import test from 'ava';
import { queryParameter } from '../../../lib/request-types/queryParameter';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = queryParameter<number, 'asdf'>();
  expectTypeOf(num).toBeNumber();

  const bool = queryParameter<boolean, 'asdf'>();
  expectTypeOf(bool).toBeBoolean();

  const boolTrue = queryParameter<true, 'asdf'>();
  expectTypeOf(boolTrue).toMatchTypeOf<true>();

  const str = queryParameter<string, 'asdf'>();
  expectTypeOf(str).toBeString();

  const strLiteral = queryParameter<'str', 'asdf'>();
  expectTypeOf(strLiteral).toMatchTypeOf<'str'>();

  const strUnion = queryParameter<'a' | 'b' | 'c', 'asdf'>();
  expectTypeOf(strUnion).toMatchTypeOf<'a' | 'b' | 'c'>();

  enum PARAM_ENUM {
    A = 'A',
    B = 'B',
    C = 'C',
  }
  const enumParam = queryParameter<PARAM_ENUM, 'asdf'>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM.A | PARAM_ENUM.B | PARAM_ENUM.C>();
  expectTypeOf(enumParam).toMatchTypeOf<'A' | 'B' | 'C'>();

  const arr = queryParameter<string[], 'asdf'>();
  expectTypeOf(arr).toBeArray();
  expectTypeOf(arr).items.toBeString();

  const obj = queryParameter<{ a: 1; b: '2'; c: 3 }, 'asdf'>();
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

  type BrandedString = string & { brand: 'test' };
  const brandedStr = queryParameter<BrandedString, 'asdf'>();
  expectTypeOf(brandedStr).toMatchTypeOf<BrandedString>();

  type CustomType = { a: string; b: number };
  const customType = queryParameter<CustomType, 'asdf'>();
  expectTypeOf(customType).toMatchTypeOf<CustomType>();
  expectTypeOf(customType).toHaveProperty('a').toBeString();
  expectTypeOf(customType).toHaveProperty('b').toBeNumber();
});
