import test from 'ava';
import { isFakeUnionOrIntersectionType } from '../../../../compiler-plugin/request-types/util/isFakeUnionOrIntersectionType';
import { expectTypeOf } from 'expect-type';
import type { FakeUnionOrIntersectionType } from '../../../../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';

const testTargets: Array<[string, unknown, boolean]> = [
  ['string', 'string', false],
  ['number', 1, false],
  ['boolean', true, false],
  ['empty object', {}, false],
  ['filled object', { a: 1, b: 2 }, false],
  ['partial FakeUnionOrIntersectionType', { fakeUnionOrIntersectionType: true }, false],
  ['FakeUnionOrIntersectionType wrong join', { fakeUnionOrIntersectionType: true, types: [], join: 'join' }, false],
  ['FakeUnionOrIntersectionType union', { fakeUnionOrIntersectionType: true, types: [], join: 'union' }, true],
  [
    'FakeUnionOrIntersectionType intersection',
    { fakeUnionOrIntersectionType: true, types: [], join: 'intersection' },
    true,
  ],
];

testTargets.forEach(([testName, target, expectedResult]) =>
  test(`${!expectedResult ? '! ' : ''}isFakeUnionOrIntersectionType ${testName}`, t => {
    const actualResult = isFakeUnionOrIntersectionType(target);
    if (actualResult) {
      expectTypeOf(target).toMatchTypeOf<FakeUnionOrIntersectionType>();
    }
    expectTypeOf(target).not.toMatchTypeOf<FakeUnionOrIntersectionType>();
    t.is(actualResult, expectedResult);
  })
);
