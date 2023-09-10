import { SwaggerfyTsError } from '../../SwaggerfyTsError';

export class RequestDoesNotContainError extends SwaggerfyTsError {
  constructor(request: any, position: 'path parameter' | 'query parameter' | 'header' | 'cookie', propertyName: string);
  constructor(request: any, position: 'body');
  constructor(
    public readonly request: any,
    public readonly position: 'path parameter' | 'query parameter' | 'header' | 'cookie' | 'body',
    public readonly propertyName?: string
  ) {
    super(`Request is missing ${position}${propertyName === undefined ? '' : ' ' + propertyName}`);
  }
}
