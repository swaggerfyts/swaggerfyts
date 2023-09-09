import test from 'ava';
import { requestBody } from '../../../lib/request-types/requestBody';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = requestBody<number>();
  expectTypeOf(num).toBeNumber();

  const bool = requestBody<boolean>();
  expectTypeOf(bool).toBeBoolean();

  const boolTrue = requestBody<true>();
  expectTypeOf(boolTrue).toMatchTypeOf<true>();

  const str = requestBody<string>();
  expectTypeOf(str).toBeString();

  const strLiteral = requestBody<'str'>();
  expectTypeOf(strLiteral).toMatchTypeOf<'str'>();

  const strUnion = requestBody<'a' | 'b' | 'c'>();
  expectTypeOf(strUnion).toMatchTypeOf<'a' | 'b' | 'c'>();

  enum PARAM_ENUM {
    A = 'A',
    B = 'B',
    C = 'C',
  }
  const enumParam = requestBody<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM.A | PARAM_ENUM.B | PARAM_ENUM.C>();
  expectTypeOf(enumParam).toMatchTypeOf<'A' | 'B' | 'C'>();

  const arr = requestBody<string[]>();
  expectTypeOf(arr).toBeArray();
  expectTypeOf(arr).items.toBeString();

  const obj = requestBody<{ a: 1; b: '2'; c: 3 }>();
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
  const brandedStr = requestBody<BrandedString>();
  expectTypeOf(brandedStr).toMatchTypeOf<BrandedString>();

  type CustomType = { a: string; b: number };
  const customType = requestBody<CustomType>();
  expectTypeOf(customType).toMatchTypeOf<CustomType>();
  expectTypeOf(customType).toHaveProperty('a').toBeString();
  expectTypeOf(customType).toHaveProperty('b').toBeNumber();
});
