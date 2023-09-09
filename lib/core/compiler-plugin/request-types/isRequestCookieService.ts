import { Node, Type } from 'ts-morph';
import { Context, Effect, Option } from 'effect';
import { CompilerPluginError } from '../errors/CompilerPluginError';
import type { FakeUnionOrIntersectionType } from './util/FakeUnionOrIntersectionType';
import { isDeafultImplementationWithName } from './util/isDeafultImplementationWithName';

export type IsRequestCookieType = (
  node: Node,
  type: Type
) => Effect.Effect<
  never,
  CompilerPluginError,
  Option.Option<{ name: string; node: Node; type: Type | FakeUnionOrIntersectionType }>
>;

export const isRequestCookieService = Context.Tag<IsRequestCookieType>();

export const isRequestCookieDefaultImplementation = Effect.provideService(
  isRequestCookieService,
  isRequestCookieService.of(isDeafultImplementationWithName('SwaggerfyTsRequestCookie'))
);
