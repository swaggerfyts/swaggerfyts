import test from 'ava';
import { requestHeader } from '../../../lib/request-types/requestHeader';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = requestHeader<number, 'asdf'>();
  expectTypeOf(num).toBeNumber();

  const bool = requestHeader<boolean, 'asdf'>();
  expectTypeOf(bool).toBeBoolean();

  const boolTrue = requestHeader<true, 'asdf'>();
  expectTypeOf(boolTrue).toMatchTypeOf<true>();

  const str = requestHeader<string, 'asdf'>();
  expectTypeOf(str).toBeString();

  const strLiteral = requestHeader<'str', 'asdf'>();
  expectTypeOf(strLiteral).toMatchTypeOf<'str'>();

  const strUnion = requestHeader<'a' | 'b' | 'c', 'asdf'>();
  expectTypeOf(strUnion).toMatchTypeOf<'a' | 'b' | 'c'>();

  enum PARAM_ENUM {
    A = 'A',
    B = 'B',
    C = 'C',
  }
  const enumParam = requestHeader<PARAM_ENUM, 'asdf'>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM.A | PARAM_ENUM.B | PARAM_ENUM.C>();
  expectTypeOf(enumParam).toMatchTypeOf<'A' | 'B' | 'C'>();

  const arr = requestHeader<string[], 'asdf'>();
  expectTypeOf(arr).toBeArray();
  expectTypeOf(arr).items.toBeString();

  const obj = requestHeader<{ a: 1; b: '2'; c: 3 }, 'asdf'>();
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
  const brandedStr = requestHeader<BrandedString, 'asdf'>();
  expectTypeOf(brandedStr).toMatchTypeOf<BrandedString>();

  type CustomType = { a: string; b: number };
  const customType = requestHeader<CustomType, 'asdf'>();
  expectTypeOf(customType).toMatchTypeOf<CustomType>();
  expectTypeOf(customType).toHaveProperty('a').toBeString();
  expectTypeOf(customType).toHaveProperty('b').toBeNumber();
});
