import { Symbol as TSMorphSymbol, SyntaxKind } from 'ts-morph';

export const propertyIsFunction = (property: TSMorphSymbol) => {
  const valueDeclaration = property.getValueDeclaration();
  if (!valueDeclaration) {
    return false;
  }

  if (
    'initializer' in valueDeclaration.compilerNode &&
    valueDeclaration.compilerNode.initializer !== undefined &&
    typeof valueDeclaration.compilerNode.initializer === 'object' &&
    valueDeclaration.compilerNode.initializer !== null &&
    'kind' in valueDeclaration.compilerNode.initializer
  ) {
    const initializer = valueDeclaration.compilerNode.initializer;
    return (
      initializer.kind === SyntaxKind.FunctionExpression || //{ a: function(){...} }
      initializer.kind === SyntaxKind.ArrowFunction
    ); //{ a: () => {...} }
  }
  return (
    valueDeclaration.isKind(SyntaxKind.MethodDeclaration) || //{ a() {...} }
    valueDeclaration.isKind(SyntaxKind.SetAccessor)
  ); //{ set a(a: ...) {...} }
};
