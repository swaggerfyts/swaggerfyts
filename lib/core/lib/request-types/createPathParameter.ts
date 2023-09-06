export type PathParameter<Type, Name extends string> = Type & {
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsType: 'SwaggerfyTsPathParam';
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsName: Name;
};

export const createPathParameter = <Type, const Name extends string>() => null as unknown as PathParameter<Type, Name>;
