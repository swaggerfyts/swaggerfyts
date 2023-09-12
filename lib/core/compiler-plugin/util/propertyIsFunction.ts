import {Symbol as TSMorphSymbol, SyntaxKind} from 'ts-morph';

export const propertyIsFunction = (property: TSMorphSymbol) => {
  const valueDeclaration = property.getValueDeclaration();
  if (!valueDeclaration) {
    return false;
  }

  if (valueDeclaration.isKind(SyntaxKind.PropertyAssignment)) {
    const initializer = valueDeclaration.compilerNode.initializer;
    return (
      initializer.kind === SyntaxKind.FunctionExpression || //{ a: function(){...} }
      initializer.kind === SyntaxKind.ArrowFunction // { a: () => {...} }
    );
  }

  if (valueDeclaration.isKind(SyntaxKind.PropertySignature)) {
    return valueDeclaration.compilerNode.type !== undefined
      && valueDeclaration.compilerNode.type.kind === SyntaxKind.FunctionType; //interface I { a: () => string; }
  }

  return (
    valueDeclaration.isKind(SyntaxKind.MethodSignature) || //interface I { a(): string; }
    valueDeclaration.isKind(SyntaxKind.MethodDeclaration) || //{ a() {...} }
    valueDeclaration.isKind(SyntaxKind.SetAccessor) //{ set a(a: ...) {...} } OR interface I { set a(a: ...); }
  );
};
