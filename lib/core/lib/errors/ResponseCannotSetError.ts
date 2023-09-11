import { SwaggerfyTsError } from '../swaggerfyts';

export class ResponseCannotSetError extends SwaggerfyTsError {
  constructor(message: string) {
    super(message);
  }
}
