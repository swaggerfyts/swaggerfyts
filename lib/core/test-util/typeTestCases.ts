/* eslint-disable security/detect-object-injection */

import { Node, Type } from 'ts-morph';
import { FakeUnionOrIntersectionType } from '../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';
import { isFakeUnionOrIntersectionType } from '../compiler-plugin/request-types/util/isFakeUnionOrIntersectionType';

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

export const numTestCase = [
  'number',
  undefined,
  (t: Type | FakeUnionOrIntersectionType) => !isFakeUnionOrIntersectionType(t) && t.isNumber(),
] as const;
export const booleanTestCase = [
  'boolean',
  undefined,
  (t: Type | FakeUnionOrIntersectionType) =>
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
] as const;
export const booleanLiteralTestCase = [
  'true',
  undefined,
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  (t: Type | FakeUnionOrIntersectionType) =>
    !isFakeUnionOrIntersectionType(t) && t.isBooleanLiteral() && t.getText() === 'true',
] as const;
export const stringTestCase = [
  'string',
  undefined,
  (t: Type | FakeUnionOrIntersectionType) => !isFakeUnionOrIntersectionType(t) && t.isString(),
] as const;
let typeTestCases: Array<
  readonly [string, string | undefined, (type: Type | FakeUnionOrIntersectionType, node: Node) => boolean]
> = [
  numTestCase,
  booleanTestCase,
  booleanLiteralTestCase,
  stringTestCase,
  ['"str"', undefined, t => !isFakeUnionOrIntersectionType(t) && t.isStringLiteral() && t.getText() === '"str"'],
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
  ],[
    '{ a: string; } & { strLiteral: "a" | "b"; } & { str: string; }',
    undefined,
    (t, n) => {
      const isStrLiteral = (tA: Type | FakeUnionOrIntersectionType, n: Node) => {
        if (isFakeUnionOrIntersectionType(tA)) {
          return false;
        }
        const prop = tA.getProperty('strLiteral');
        return (
          !isFakeUnionOrIntersectionType(tA) &&
          tA.isObject() &&
          tA.getProperties().length === 1 &&
          prop !== undefined &&
          prop.getTypeAtLocation(n).isUnion() &&
          prop.getTypeAtLocation(n).getUnionTypes().length === 2 &&
          prop.getTypeAtLocation(n).getUnionTypes().every(tu => tu.isStringLiteral()) &&
          (
            prop.getTypeAtLocation(n).getUnionTypes().every((tu, index) => tu.getText() === ['"a"', '"b"'][index]) ||
            prop.getTypeAtLocation(n).getUnionTypes().every((tu, index) => tu.getText() === ['"b"', '"a"'][index])
          )
        );
      };
      const isStr = (tA: Type | FakeUnionOrIntersectionType, n: Node) => {
        if (isFakeUnionOrIntersectionType(tA)) {
          return false;
        }
        const prop = tA.getProperty('str');
        return (
          !isFakeUnionOrIntersectionType(tA) &&
          tA.isObject() &&
          tA.getProperties().length === 1 &&
          prop !== undefined &&
          prop.getTypeAtLocation(n).isString()
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
        ((isA(types[0], n) && isStr(types[1], n) && isStrLiteral(types[2], n)) ||
          (isA(types[0], n) && isStr(types[2], n) && isStrLiteral(types[1], n)) ||
          (isA(types[1], n) && isStr(types[0], n) && isStrLiteral(types[2], n)) ||
          (isA(types[1], n) && isStr(types[2], n) && isStrLiteral(types[0], n)) ||
          (isA(types[2], n) && isStr(types[0], n) && isStrLiteral(types[1], n)) ||
          (isA(types[2], n) && isStr(types[1], n) && isStrLiteral(types[0], n)))
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
typeTestCases = typeTestCases.flatMap(([type, preStatement, predicate]) => {
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

export { typeTestCases };
