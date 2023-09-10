/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context, Effect } from 'effect';
import { Readable } from 'stream';
import { RequestDoesNotContainError } from './errors/RequestDoesNotContainError';
import { RequestCannotAccessError } from './errors/RequestCannotAccessError';
import { ResponseCannotSetError } from './errors/ResponseCannotSetError';
import { jsonIoService } from './io/jsonIoService';
import { JsonSerializeError } from './errors/JsonSerializeError';

export interface WebFrameworkServiceType<HandlerFnParams extends any[]> {
  readonly getPathParam: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, unknown>;
  readonly getQueryParam: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, unknown>;
  readonly getHeader: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, unknown>;
  readonly getCookie: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, unknown>;
  readonly getBody: (
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, RequestDoesNotContainError | RequestCannotAccessError, string>;

  readonly setHeader: (
    name: string,
    value: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, undefined>;
  readonly setCookie: (
    name: string,
    value: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, undefined>;
  readonly deleteCookie: (
    name: string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, undefined>;

  readonly sendEmptyBody: (
    statusCode: number,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, undefined>;
  readonly sendJsonBody: (
    statusCode: number,
    jsonUnserialized: any,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<typeof jsonIoService, ResponseCannotSetError | JsonSerializeError, undefined>;
  readonly sendFile: (
    statusCode: number,
    file: ArrayBuffer | Readable | string,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    contentDisposition: 'inline' | 'attachment' | string,
    ...handlerFnParams: HandlerFnParams
  ) => Effect.Effect<never, ResponseCannotSetError, undefined>;
}

export const webFrameworkService = Context.Tag<WebFrameworkServiceType<any[]>>();
