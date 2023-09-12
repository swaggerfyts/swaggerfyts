import { Node, Type } from 'ts-morph';
import { Context, Effect, Option } from 'effect';
import { CompilerPluginError } from '../errors/CompilerPluginError';
import type { FakeUnionOrIntersectionType } from './util/FakeUnionOrIntersectionType';
import { isDeafultImplementationWithName } from './util/isDeafultImplementationWithName';

export type IsPathParameterType = (
  node: Node,
  type: Type
) => Effect.Effect<
  unknown,
  CompilerPluginError,
  Option.Option<{ name: string; node: Node; type: Type | FakeUnionOrIntersectionType }>
>;

export const isPathParameterService = Context.Tag<IsPathParameterType>();

export const isPathParameterDefaultImplementation = Effect.provideService(
  isPathParameterService,
  isPathParameterService.of(isDeafultImplementationWithName('SwaggerfyTsPathParam'))
);
