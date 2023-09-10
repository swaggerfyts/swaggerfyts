import { SwaggerfyTsError } from '../swaggerfyts';

export class ResponseCannotSetError extends SwaggerfyTsError {
  constructor(
    message: string,
    public readonly response: any
  ) {
    super(message);
  }
}
