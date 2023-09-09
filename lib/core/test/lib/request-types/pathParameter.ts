import test from 'ava';
import { pathParameter } from '../../../lib/request-types/pathParameter';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = pathParameter<number, 'asdf'>();
  expectTypeOf(num).toBeNumber();

  const bool = pathParameter<boolean, 'asdf'>();
  expectTypeOf(bool).toBeBoolean();

  const boolTrue = pathParameter<true, 'asdf'>();
  expectTypeOf(boolTrue).toMatchTypeOf<true>();

  const str = pathParameter<string, 'asdf'>();
  expectTypeOf(str).toBeString();

  const strLiteral = pathParameter<'str', 'asdf'>();
  expectTypeOf(strLiteral).toMatchTypeOf<'str'>();

  const strUnion = pathParameter<'a' | 'b' | 'c', 'asdf'>();
  expectTypeOf(strUnion).toMatchTypeOf<'a' | 'b' | 'c'>();

  enum PARAM_ENUM {
    A = 'A',
    B = 'B',
    C = 'C',
  }
  const enumParam = pathParameter<PARAM_ENUM, 'asdf'>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM.A | PARAM_ENUM.B | PARAM_ENUM.C>();
  expectTypeOf(enumParam).toMatchTypeOf<'A' | 'B' | 'C'>();

  const arr = pathParameter<string[], 'asdf'>();
  expectTypeOf(arr).toBeArray();
  expectTypeOf(arr).items.toBeString();

  const obj = pathParameter<{ a: 1; b: '2'; c: 3 }, 'asdf'>();
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
  const brandedStr = pathParameter<BrandedString, 'asdf'>();
  expectTypeOf(brandedStr).toMatchTypeOf<BrandedString>();

  type CustomType = { a: string; b: number };
  const customType = pathParameter<CustomType, 'asdf'>();
  expectTypeOf(customType).toMatchTypeOf<CustomType>();
  expectTypeOf(customType).toHaveProperty('a').toBeString();
  expectTypeOf(customType).toHaveProperty('b').toBeNumber();
});
