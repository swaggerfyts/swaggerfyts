import test from 'ava';
import { Effect, pipe } from 'effect';
import {
  isRequestParameterDefaultImplementation,
  isRequestParameterService,
} from '../../../compiler-plugin/request-types/isRequestParameterService';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import { tsMorphProject } from '../../../test-util/tsMorphProject';

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/pathParameter.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `import { pathParameter } from './lib/request-types/pathParameter'; ${
        preStatement || ''
      } const param = pathParameter<${type}, 'asdf'>();`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isRequestParameterService)(sourceFile),
      isRequestParameterDefaultImplementation,
      Effect.runSyncExit,
      testIsServiceResultEffect('asdf', predicate, t)
    );
  })
);
