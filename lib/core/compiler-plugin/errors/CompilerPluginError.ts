import { Node, ts } from 'ts-morph';
import { SwaggerfyTsError } from '../../SwaggerfyTsError';

export class CompilerPluginError extends SwaggerfyTsError {
  public readonly isCompilerPluginError = true;

  constructor(nodeParam: Node | ts.Node, message: string) {
    const node = 'compilerNode' in nodeParam ? nodeParam.compilerNode : nodeParam;
    const file = node.getSourceFile().fileName;
    const { line } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
    super(`${message} at ${file} on line ${line + 1}: ${node.getText().substring(0, 30)}`);
  }
}
