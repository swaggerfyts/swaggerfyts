export type QueryParameter<Type, Name extends string> = Type & {
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsType: 'SwaggerfyTsQueryParam';
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsName: Name;
};

export const queryParameter = <const Type, const Name extends string>() =>
  null as unknown as QueryParameter<Type, Name>;
