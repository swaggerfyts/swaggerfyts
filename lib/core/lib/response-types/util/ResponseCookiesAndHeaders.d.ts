/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResponseCookiesAndHeaders =
  | undefined
  | { headers?: Record<string, any>; httpCookies?: Record<string, any>; jsCookies?: Record<string, any> };
