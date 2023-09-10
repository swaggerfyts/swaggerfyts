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
      `${prefix}\nexport const test = {a: null as unknown as ${type}, b: function(){return true;}, c: () => true, d() {return true;}, set e(newE: number) {}, f: "str"};`,
      { overwrite: true }
    );

    const testVariable = sourceFile.getVariableDeclaration('test');
    if (testVariable === undefined) {
      t.fail('Interface not found');
      return;
    }

    testCases.forEach(([propertyKey, expectedResult]) => {
      const property = testVariable.getType().getProperty(propertyKey);
      if (property === undefined) {
        t.fail(`Cannot find property ${propertyKey}`);
        return;
      }
      const actualResult = propertyIsFunction(property);
      t.is(actualResult, expectedResult, `property ${propertyKey}`);
    });
  })
);
