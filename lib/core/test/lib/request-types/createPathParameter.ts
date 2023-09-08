import test from 'ava';
import { createPathParameter } from '../../../lib/request-types/createPathParameter';
import { expectTypeOf } from 'expect-type';

test('correct type', t => {
  const num = createPathParameter<number, 'asdf'>();
  expectTypeOf(num).toBeNumber();

  const bool = createPathParameter<boolean, 'asdf'>();
  expectTypeOf(bool).toBeBoolean();

  const boolTrue = createPathParameter<true, 'asdf'>();
  expectTypeOf(boolTrue).toMatchTypeOf<true>();

  const str = createPathParameter<string, 'asdf'>();
  expectTypeOf(str).toBeString();

  const strLiteral = createPathParameter<'str', 'asdf'>();
  expectTypeOf(strLiteral).toMatchTypeOf<'str'>();

  const strUnion = createPathParameter<'a' | 'b' | 'c', 'asdf'>();
  expectTypeOf(strUnion).toMatchTypeOf<'a' | 'b' | 'c'>();

  enum PARAM_ENUM {
    A = 'A',
    B = 'B',
    C = 'C',
  }
  const enumParam = createPathParameter<PARAM_ENUM, 'asdf'>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM>();
  expectTypeOf(enumParam).toMatchTypeOf<PARAM_ENUM.A | PARAM_ENUM.B | PARAM_ENUM.C>();
  expectTypeOf(enumParam).toMatchTypeOf<'A' | 'B' | 'C'>();

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

  type BrandedString = string & { brand: 'test' };
  const brandedStr = createPathParameter<BrandedString, 'asdf'>();
  expectTypeOf(brandedStr).toMatchTypeOf<BrandedString>();

  type CustomType = { a: string; b: number };
  const customType = createPathParameter<CustomType, 'asdf'>();
  expectTypeOf(customType).toMatchTypeOf<CustomType>();
  expectTypeOf(customType).toHaveProperty('a').toBeString();
  expectTypeOf(customType).toHaveProperty('b').toBeNumber();
});
