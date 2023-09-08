import { Type } from 'ts-morph';

export type FakeUnionOrIntersectionType = {
  fakeUnionOrIntersectionType: true;
  types: Array<Type | FakeUnionOrIntersectionType>;
  join: 'union' | 'intersection';
};
