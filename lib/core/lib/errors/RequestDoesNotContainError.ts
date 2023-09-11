import { SwaggerfyTsError } from '../../SwaggerfyTsError';

export class RequestDoesNotContainError extends SwaggerfyTsError {
  constructor(position: 'path parameter' | 'query parameter' | 'header' | 'cookie', propertyName: string);
  constructor(position: 'body');
  constructor(
    public readonly position: 'path parameter' | 'query parameter' | 'header' | 'cookie' | 'body',
    public readonly propertyName?: string
  ) {
    super(`Request is missing ${position}${propertyName === undefined ? '' : ' ' + propertyName}`);
  }
}
