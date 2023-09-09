export type RequestHeader<Type, Name extends string> = Type & {
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsType: 'SwaggerfyTsRequestHeader';
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsName: Name;
};

export const requestHeader = <const Type, const Name extends string>() => null as unknown as RequestHeader<Type, Name>;
