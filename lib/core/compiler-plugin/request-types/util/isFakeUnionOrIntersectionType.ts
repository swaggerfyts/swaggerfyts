import type {FakeUnionOrIntersectionType} from "./FakeUnionOrIntersectionType";

export const isFakeUnionOrIntersectionType = (target: unknown): target is FakeUnionOrIntersectionType =>
  typeof target === 'object'
  && target !== null
  && 'fakeUnionOrIntersectionType' in target
  && target.fakeUnionOrIntersectionType === true
  && 'types' in target
  && Array.isArray(target.types)
  && 'join' in target
  && typeof target.join === 'string'
  && ['union', 'intersection'].includes(target.join)
