import test from 'ava';
import { Effect, pipe } from 'effect';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import {
  isRequestCookieDefaultImplementation,
  isRequestCookieService,
} from '../../../compiler-plugin/request-types/isRequestCookieService';

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestCookie.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `import { requestCookie } from './lib/request-types/requestCookie'; ${
        preStatement || ''
      } const param = requestCookie<${type}, 'abcd'>();`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isRequestCookieService)(sourceFile),
      isRequestCookieDefaultImplementation,
      Effect.runSyncExit,
      testIsServiceResultEffect('abcd', predicate, t)
    );
  })
);
