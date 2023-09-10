import { SwaggerfyTsError } from '../swaggerfyts';

export class HeaderParseError extends SwaggerfyTsError {
  constructor(
    public input: string,
    public parseContext: any,
    messagePostfix?: string
  ) {
    super(
      `Parsing failed of "${input}" using context ${JSON.stringify(parseContext)}${
        messagePostfix ? `: ${messagePostfix}` : ''
      }`
    );
  }
}
