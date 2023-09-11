import { CompilerPluginError } from './CompilerPluginError';
import { Node, ts } from 'ts-morph';

export class TypeNotSupportedError extends CompilerPluginError {
  constructor(
    nodeParam: Node | ts.Node,
    readableTypeDescription: string,
    public readonly position: 'query parameter' | 'path parameter' | 'header' | 'cookie'
  ) {
    super(nodeParam, `${readableTypeDescription} not supported in ${position}s`);
  }
}
