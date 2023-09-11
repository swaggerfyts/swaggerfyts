import test from 'ava';
import { mapKey } from '../../util/mapKeys';
import { expectTypeOf } from 'expect-type';

test('mapKey', t => {
  const result = mapKey({ a: 1, b: 'string' }, f => `prefix${f}`);
  expectTypeOf(result).toHaveProperty('prefixa').toMatchTypeOf<1 | 'string'>();
  expectTypeOf(result).toHaveProperty('prefixb').toMatchTypeOf<1 | 'string'>();

  t.deepEqual(result, { prefixa: 1, prefixb: 'string' });
});

test('mapKey curried', t => {
  const curried = mapKey(f => `prefix${f}`);
  const result = curried({ a: 1, b: 'string' });
  expectTypeOf(result).toHaveProperty('prefixa').toMatchTypeOf<1 | 'string'>();
  expectTypeOf(result).toHaveProperty('prefixb').toMatchTypeOf<1 | 'string'>();

  t.deepEqual(result, { prefixa: 1, prefixb: 'string' });
});
