import test from 'ava';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { propertyIsFunction } from '../../../compiler-plugin/util/propertyIsFunction';

const testCases: Array<[string, boolean]> = [
  ['a', false],
  ['b', true],
  ['c', true],
  ['d', true],
  ['e', true],
  ['f', false],
];
typeTestCases.forEach(([type, prefix]) =>
  test(type, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `${prefix}\n` +
      `export const test = {a: null as unknown as ${type}, b: function(){return true;}, c: () => true, d() {return true;}, set e(newE: number) {}, f: "str"};` +
      `export interface Test { a: ${type}; b: () => true, c(): void; d(): true; set e(new E: number); f: string;}`,
      {overwrite: true}
    );

    const testVariable = sourceFile.getVariableDeclaration('test');
    if (testVariable === undefined) {
      t.fail('Variable not found');
      return;
    }

    const testInterface = sourceFile.getInterface('Test');
    if (testInterface === undefined) {
      t.fail('Interface not found');
      return;
    }

    [testVariable, testInterface].forEach(node =>
      testCases.forEach(([propertyKey, expectedResult]) => {
        const property = node.getType().getProperty(propertyKey);
        if (property === undefined) {
          t.fail(`Cannot find property ${propertyKey}`);
          return;
        }
        const actualResult = propertyIsFunction(property);
        t.is(actualResult, expectedResult, `${node.getName()}.${propertyKey}`);
      })
    )
  })
);

const builtInObjectsTestCases = {
  Date: [
    'toString',
    'toDateString',
    'toTimeString',
    'toLocaleString',
    'toLocaleDateString',
    'toLocaleTimeString',
    'valueOf',
    'getTime',
    'getFullYear',
    'getUTCFullYear',
    'getMonth',
    'getUTCMonth',
    'getDate',
    'getUTCDate',
    'getDay',
    'getUTCDay',
    'getHours',
    'getUTCHours',
    'getMinutes',
    'getUTCMinutes',
    'getSeconds',
    'getUTCSeconds',
    'getMilliseconds',
    'getUTCMilliseconds',
    'getTimezoneOffset',
    'setTime',
    'setMilliseconds',
    'setUTCMilliseconds',
    'setSeconds',
    'setUTCSeconds',
    'setMinutes',
    'setUTCMinutes',
    'setHours',
    'setUTCHours',
    'setDate',
    'setUTCDate',
    'setMonth',
    'setUTCMonth',
    'setFullYear',
    'setUTCFullYear',
    'toUTCString',
    'toISOString',
    'toJSON',
  ],
  String: [
    'toString',
    'charAt',
    'charCodeAt',
    'concat',
    'indexOf',
    'lastIndexOf',
    'localeCompare',
    'match',
    'replace',
    'search',
    'slice',
    'split',
    'substring',
    'toLowerCase',
    'toLocaleLowerCase',
    'toUpperCase',
    'toLocaleUpperCase',
    'trim',
    'substr',
    'valueOf',
  ]
}

Object.entries(builtInObjectsTestCases).forEach(([objectName, functionNames]) =>
  functionNames.forEach(functionName =>
    test(`${objectName}.${functionName}`, t => {
      const sourceFile = tsMorphProject.createSourceFile(
        'test.ts',
        `export const test = new ${objectName}();`,
        { overwrite: true }
      );

      const testVariable = sourceFile.getVariableDeclaration('test');
      if (testVariable === undefined) {
        t.fail('Interface not found');
        return;
      }

      const property = testVariable.getType().getProperty(functionName);
      if (property === undefined) {
        t.fail(`Cannot find property ${functionName}`);
        return;
      }

      const actualResult = propertyIsFunction(property);
      t.is(actualResult, true, `property ${functionName}`);
    })
  )
)
