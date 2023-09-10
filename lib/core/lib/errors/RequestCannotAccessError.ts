import { SwaggerfyTsError } from '../../SwaggerfyTsError';

export class RequestCannotAccessError extends SwaggerfyTsError {
  constructor(
    message: string,
    request: any,
    position: 'path parameter' | 'query parameter' | 'header' | 'cookie',
    propertyName: string
  );
  constructor(message: string, request: any, position: 'body');
  constructor(
    message: string,
    public readonly request: any,
    public readonly position: 'path parameter' | 'query parameter' | 'header' | 'cookie' | 'body',
    public readonly propertyName?: string
  ) {
    super(message);
  }
}
