import { SwaggerfyTsError } from '../swaggerfyts';

export class ParameterParseError extends SwaggerfyTsError {
  constructor(
    public input: string,
    public parseContext: any, //eslint-disable-line @typescript-eslint/no-explicit-any
    messagePostfix?: string
  ) {
    super(
      `Parsing failed of "${input}" using context ${JSON.stringify(parseContext)}${
        messagePostfix ? `: ${messagePostfix}` : ''
      }`
    );
  }
}
