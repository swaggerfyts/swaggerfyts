import { SwaggerfyTsError } from '../../SwaggerfyTsError';

export class RequestCannotAccessError extends SwaggerfyTsError {
  constructor(
    message: string,
    position: 'path parameter' | 'query parameter' | 'header' | 'cookie',
    propertyName: string
  );
  constructor(message: string, position: 'body');
  constructor(
    message: string,
    public readonly position: 'path parameter' | 'query parameter' | 'header' | 'cookie' | 'body',
    public readonly propertyName?: string
  ) {
    super(message);
  }
}
