/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context, Effect } from 'effect';
import { Readable } from 'stream';
import { RequestDoesNotContainError } from './errors/RequestDoesNotContainError';
import { RequestCannotAccessError } from './errors/RequestCannotAccessError';
import { ResponseCannotSetError } from './errors/ResponseCannotSetError';
import { JsonSerializeError } from './errors/JsonSerializeError';

export interface WebFrameworkServiceType<HandlerFnParams extends any[]> {
  readonly getPathParameter: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;
  readonly getRawQueryString: (
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;
  readonly getHeader: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;
  readonly getCookie: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;
  readonly getBody: (
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;

  readonly setHeader: (
    name: string,
    value: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, true>;
  readonly setCookie: (
    name: string,
    value: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, true>;
  readonly deleteCookie: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, true>;

  readonly sendEmptyBody: (
    statusCode: number,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, true>;
  readonly sendJsonBody: (
    statusCode: number,
    jsonSerialized: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError | JsonSerializeError, true>;
  readonly sendFile: (
    statusCode: number,
    file: ArrayBuffer | Readable | string,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    contentDisposition: 'inline' | 'attachment' | string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, true>;
}

export const webFrameworkService = Context.Tag<WebFrameworkServiceType<any[]>>();
