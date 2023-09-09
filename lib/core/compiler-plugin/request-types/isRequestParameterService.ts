import { Node, Type } from 'ts-morph';
import { Context, Effect, Option } from 'effect';
import { CompilerPluginError } from '../errors/CompilerPluginError';
import type { FakeUnionOrIntersectionType } from './util/FakeUnionOrIntersectionType';
import { isDeafultImplementationWithName } from './util/isDeafultImplementationWithName';

export type IsRequestParameterType = (
  node: Node,
  type: Type
) => Effect.Effect<
  never,
  CompilerPluginError,
  Option.Option<{ name: string; node: Node; type: Type | FakeUnionOrIntersectionType }>
>;

export const isRequestParameterService = Context.Tag<IsRequestParameterType>();

export const isRequestParameterDefaultImplementation = Effect.provideService(
  isRequestParameterService,
  isRequestParameterService.of(isDeafultImplementationWithName('SwaggerfyTsPathParam'))
);
