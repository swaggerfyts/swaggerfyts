import test from 'ava';
import { Effect, pipe } from 'effect';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import {
  isRequestHeaderDefaultImplementation,
  isRequestHeaderService,
} from '../../../compiler-plugin/request-types/isRequestHeaderService';

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestHeader.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `import { requestHeader } from './lib/request-types/requestHeader'; ${
        preStatement || ''
      } const param = requestHeader<${type}, 'qwertz'>();`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isRequestHeaderService)(sourceFile),
      isRequestHeaderDefaultImplementation,
      Effect.runSyncExit,
      testIsServiceResultEffect('qwertz', predicate, t)
    );
  })
);
