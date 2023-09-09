export type RequestCookie<Type, Name extends string> = Type & {
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsType: 'SwaggerfyTsRequestCookie';
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsName: Name;
};

export const requestCookie = <const Type, const Name extends string>() => null as unknown as RequestCookie<Type, Name>;
