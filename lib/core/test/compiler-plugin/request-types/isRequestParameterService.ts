/* eslint-disable security/detect-object-injection */

import test from 'ava';
import { Node, Project, SourceFile, SyntaxKind, Type } from 'ts-morph';
import { Effect, Exit, Option, pipe, ReadonlyArray } from 'effect';
import {
  isRequestParameterDefaultImplementation,
  isRequestParameterService,
} from '../../../compiler-plugin/request-types/isRequestParameterService';
import type { FakeUnionOrIntersectionType } from '../../../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';
import { isFakeUnionOrIntersectionType } from '../../../compiler-plugin/request-types/util/isFakeUnionOrIntersectionType';

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  tsConfigFilePath: __dirname + '/../../../tsconfig.json',
  compilerOptions: {
    noEmit: true,
  },
});
project.addSourceFileAtPath(__dirname + '/../../../lib/request-types/pathParameter.ts');

const getRequestParameterResults = Effect.serviceFunctionEffect(
  isRequestParameterService,
  isRequestParameter => (sourceFile: SourceFile) =>
    pipe(
      Effect.succeed(sourceFile),
      //Effect<isRequestParameterService, never, SourceFile>
      Effect.map(sourceFile => sourceFile.getDescendants()),
      //Effect<isRequestParameterService, never, [Node, Node, ...]>
      Effect.map(ReadonlyArray.filter(node => node.isKind(SyntaxKind.CallExpression))),
      //Effect<isRequestParameterService, never, [Node, Node, ...]>
      Effect.map(ReadonlyArray.map(node => [node, node.getType()] satisfies [Node, Type])),
      //Effect<isRequestParameterService, never, [[Node, Type], [Node, Type], ...]>
      Effect.map(ReadonlyArray.map(([node, type]) => isRequestParameter(node, type))),
      //Effect<isRequestParameterService, never, [Effect<never, CompilerErrors, Option.Some<{name: string, intersectionType: Type}>>, Effect<never, CompilerErrors, Option.None<{name: string, intersectionType: Type}>>, ...]>
      Effect.flatMap(Effect.all),
      //Effect<isRequestParameterService, CompilerErrors, [Option.Some<{name: string, intersectionType: Type}>, Option.None<{name: string, intersectionType: Type}, ...]>
      Effect.map(ReadonlyArray.filter(Option.isSome)),
      //Effect<isRequestParameterService, CompilerErrors, [Option.Some<{name: string, intersectionType: Type}>, ...]>
      Effect.map(ReadonlyArray.map(option => option.value))
      //Effect<isRequestParameterService, CompilerErrors, [{name: string, intersectionType: Type}, ...]>
    )
);

const isA = (tA: Type | FakeUnionOrIntersectionType, n: Node) => {
  if (isFakeUnionOrIntersectionType(tA)) {
    return false;
  }
  const prop = tA.getProperty('a');
  return (
    !isFakeUnionOrIntersectionType(tA) &&
    tA.isObject() &&
    tA.getProperties().length === 1 &&
    prop !== undefined &&
    prop.getTypeAtLocation(n).isString()
  );
};
const isB = (tB: Type | FakeUnionOrIntersectionType, n: Node) => {
  if (isFakeUnionOrIntersectionType(tB)) {
    return false;
  }
  const prop = tB.getProperty('b');
  return (
    !isFakeUnionOrIntersectionType(tB) &&
    tB.isObject() &&
    tB.getProperties().length === 1 &&
    prop !== undefined &&
    prop.getTypeAtLocation(n).isNumber()
  );
};

let simpleTests: Array<
  [string, string | undefined, (type: Type | FakeUnionOrIntersectionType, node: Node) => boolean]
> = [
  ['number', undefined, t => !isFakeUnionOrIntersectionType(t) && t.isNumber()],
  [
    'boolean',
    undefined,
    t =>
      (!isFakeUnionOrIntersectionType(t) && t.isBoolean()) ||
      (isFakeUnionOrIntersectionType(t) &&
        t.join === 'union' &&
        t.types.length === 2 &&
        t.types.every(
          (ut, index) =>
            !isFakeUnionOrIntersectionType(ut) &&
            ut.isBooleanLiteral() &&
            (ut.getText() === ['false', 'true'][index] || ut.getText() === ['true', 'false'][index])
        )),
  ],
  ['true', undefined, t => !isFakeUnionOrIntersectionType(t) && t.isBooleanLiteral() && t.getText() === 'true'],
  ['string', undefined, t => !isFakeUnionOrIntersectionType(t) && t.isString()],
  [
    'string & {__brand: "a"}',
    undefined,
    (t, n) => {
      const types = isFakeUnionOrIntersectionType(t) ? t.types : t.getIntersectionTypes();

      const isBrand = (tB: Type | FakeUnionOrIntersectionType, n: Node) => {
        if (isFakeUnionOrIntersectionType(tB)) {
          return false;
        }
        const prop = tB.getProperty('__brand');
        const propType = prop?.getTypeAtLocation(n);
        return (
          !isFakeUnionOrIntersectionType(tB) &&
          tB.isObject() &&
          tB.getProperties().length === 1 &&
          prop !== undefined &&
          propType !== undefined &&
          propType.isStringLiteral() &&
          propType.getText() === '"a"'
        );
      };

      return (
        types.length === 2 &&
        types[0] !== undefined &&
        types[1] !== undefined &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'intersection') ||
          (!isFakeUnionOrIntersectionType(t) && t.isIntersection())) &&
        ((!isFakeUnionOrIntersectionType(types[0]) && types[0].isString() && isBrand(types[1], n)) ||
          (!isFakeUnionOrIntersectionType(types[1]) && types[1].isString() && isBrand(types[0], n)))
      );
    },
  ],
  ['"str"', undefined, t => !isFakeUnionOrIntersectionType(t) && t.isStringLiteral() && t.getText() === '"str"'],
  [
    '"a" | "b"',
    undefined,
    t => {
      const unionTypes = isFakeUnionOrIntersectionType(t) ? t.types : t.getUnionTypes();
      return (
        ((!isFakeUnionOrIntersectionType(t) && t.isUnion()) ||
          (isFakeUnionOrIntersectionType(t) && t.join === 'union')) &&
        unionTypes.length === 2 &&
        unionTypes.every(
          (ut, index) =>
            !isFakeUnionOrIntersectionType(ut) && ut.isStringLiteral() && ut.getText() === ['"a"', '"b"'][index]
        )
      );
    },
  ],
  [
    '[string, number]',
    undefined,
    t => {
      if (isFakeUnionOrIntersectionType(t)) {
        return false;
      }

      const tupleElements = t.getTupleElements();
      return (
        t.isTuple() &&
        tupleElements !== undefined &&
        tupleElements.length === 2 &&
        tupleElements[0] !== undefined &&
        tupleElements[0].isString() &&
        tupleElements[1] !== undefined &&
        tupleElements[1].isNumber()
      );
    },
  ],
  [
    '{ a: string; b: number; }',
    undefined,
    (t, n) => {
      if (isFakeUnionOrIntersectionType(t)) {
        return false;
      }

      const propertyA = t.getProperty('a');
      const propertyB = t.getProperty('b');

      return (
        t.isObject() &&
        t.getProperties().length === 2 &&
        propertyA !== undefined &&
        propertyA.getTypeAtLocation(n).isString() &&
        propertyB !== undefined &&
        propertyB.getTypeAtLocation(n).isNumber()
      );
    },
  ],
  [
    '{ a: string; } & { b: number; }',
    undefined,
    (t, n) => {
      const types = isFakeUnionOrIntersectionType(t) ? t.types : t.getIntersectionTypes();

      return (
        types.length === 2 &&
        types[0] !== undefined &&
        types[1] !== undefined &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'intersection') ||
          (!isFakeUnionOrIntersectionType(t) && t.isIntersection())) &&
        ((isA(types[0], n) && isB(types[1], n)) || (isA(types[1], n) && isB(types[0], n)))
      );
    },
  ],
  [
    '{ a: string; } & { b: number; } & { c: "c"; }',
    undefined,
    (t, n) => {
      const isC = (tC: Type | FakeUnionOrIntersectionType, n: Node) => {
        if (isFakeUnionOrIntersectionType(tC)) {
          return false;
        }
        const prop = tC.getProperty('c');
        const propType = prop?.getTypeAtLocation(n);
        return (
          !isFakeUnionOrIntersectionType(tC) &&
          tC.isObject() &&
          tC.getProperties().length === 1 &&
          prop !== undefined &&
          propType !== undefined &&
          propType.isStringLiteral() &&
          propType.getText() === '"c"'
        );
      };

      const types = isFakeUnionOrIntersectionType(t) ? t.types : t.getIntersectionTypes();
      return (
        types.length === 3 &&
        types[0] !== undefined &&
        types[1] !== undefined &&
        types[2] !== undefined &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'intersection') ||
          (!isFakeUnionOrIntersectionType(t) && t.isIntersection())) &&
        ((isA(types[0], n) && isB(types[1], n) && isC(types[2], n)) ||
          (isA(types[0], n) && isB(types[2], n) && isC(types[1], n)) ||
          (isA(types[1], n) && isB(types[0], n) && isC(types[2], n)) ||
          (isA(types[1], n) && isB(types[2], n) && isC(types[0], n)) ||
          (isA(types[2], n) && isB(types[0], n) && isC(types[1], n)) ||
          (isA(types[2], n) && isB(types[1], n) && isC(types[0], n)))
      );
    },
  ],
  [
    'STRING_ENUM',
    'enum STRING_ENUM { A = "A", B = "B" };',
    t => {
      const enumTypes = isFakeUnionOrIntersectionType(t) ? t.types : t.getUnionTypes();
      return (
        enumTypes.length === 2 &&
        enumTypes[0] !== undefined &&
        enumTypes[1] !== undefined &&
        enumTypes.every(te => !isFakeUnionOrIntersectionType(te) && te.isEnumLiteral()) &&
        (enumTypes.every(
          (te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === ['A', 'B'][index]
        ) ||
          enumTypes.every(
            (te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === ['B', 'A'][index]
          )) &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'union') || (!isFakeUnionOrIntersectionType(t) && t.isEnum()))
      );
    },
  ],
  [
    'NUMBERED_ENUM',
    'enum NUMBERED_ENUM { A = 2, B = 4 };',
    t => {
      const enumTypes = isFakeUnionOrIntersectionType(t) ? t.types : t.getUnionTypes();

      return (
        enumTypes.length === 2 &&
        enumTypes[0] !== undefined &&
        enumTypes[1] !== undefined &&
        enumTypes.every(te => !isFakeUnionOrIntersectionType(te) && te.isEnumLiteral()) &&
        (enumTypes.every((te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === [2, 4][index]) ||
          enumTypes.every(
            (te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === [4, 2][index]
          )) &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'union') || (!isFakeUnionOrIntersectionType(t) && t.isEnum()))
      );
    },
  ],
  [
    'INDEXED_ENUM',
    'enum INDEXED_ENUM { A, B };',
    t => {
      const enumTypes = isFakeUnionOrIntersectionType(t) ? t.types : t.getUnionTypes();
      return (
        enumTypes.length === 2 &&
        enumTypes[0] !== undefined &&
        enumTypes[1] !== undefined &&
        enumTypes.every(te => !isFakeUnionOrIntersectionType(te) && te.isEnumLiteral()) &&
        (enumTypes.every((te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === [0, 1][index]) ||
          enumTypes.every(
            (te, index) => !isFakeUnionOrIntersectionType(te) && te.getLiteralValue() === [1, 0][index]
          )) &&
        ((isFakeUnionOrIntersectionType(t) && t.join === 'union') || (!isFakeUnionOrIntersectionType(t) && t.isEnum()))
      );
    },
  ],
];
simpleTests = simpleTests.flatMap(([type, preStatement, predicate]) => {
  const arrayType = `Array<${type}>`;
  const arrayPredicate = (t: Type | FakeUnionOrIntersectionType, n: Node) => {
    if (isFakeUnionOrIntersectionType(t)) {
      return false;
    }

    const arrayType = t.getArrayElementType();
    return t.isArray() && arrayType !== undefined && predicate(arrayType, n);
  };

  return [
    [type, preStatement, predicate],
    [arrayType, preStatement, arrayPredicate],
  ];
});

simpleTests.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { pathParameter } from './lib/request-types/pathParameter'; ${
        preStatement || ''
      } const param = pathParameter<${type}, 'asdf'>();`,
      { overwrite: true }
    );

    pipe(
      getRequestParameterResults(sourceFile),
      isRequestParameterDefaultImplementation,
      Effect.runSyncExit,
      Exit.mapBoth({
        onFailure: error => {
          t.log(error);
          t.fail();
        },
        onSuccess: results => {
          t.is(results.length, 1);
          t.not(results[0], undefined);
          t.true('node' in results[0]!);
          t.is(results[0]!.name, 'asdf');
          t.true(predicate(results[0]!.type, results[0]!.node));
        },
      })
    );
  })
);
