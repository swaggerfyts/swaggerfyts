export type RequestBody<Type> = Type & {
  /** @deprecated This property isn't available at runtime!! */
  readonly swaggerfyTsType: 'SwaggerfyTsRequestBody';
};

export const requestBody = <const Type>() => null as unknown as RequestBody<Type>;
