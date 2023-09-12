import { Node, Type } from 'ts-morph';
import { Context, Effect, Option } from 'effect';
import { CompilerPluginError } from '../errors/CompilerPluginError';
import type { FakeUnionOrIntersectionType } from './util/FakeUnionOrIntersectionType';
import { isDeafultImplementationWithName } from './util/isDeafultImplementationWithName';

export type IsRequestHeaderType = (
  node: Node,
  type: Type
) => Effect.Effect<
  unknown,
  CompilerPluginError,
  Option.Option<{ name: string; node: Node; type: Type | FakeUnionOrIntersectionType }>
>;

export const isRequestHeaderService = Context.Tag<IsRequestHeaderType>();

export const isRequestHeaderDefaultImplementation = Effect.provideService(
  isRequestHeaderService,
  isRequestHeaderService.of(isDeafultImplementationWithName('SwaggerfyTsRequestHeader'))
);
