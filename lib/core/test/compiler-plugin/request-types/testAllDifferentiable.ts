import test from 'ava';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import {
  booleanLiteralTestCase,
  booleanTestCase,
  numTestCase,
  stringTestCase,
  typeTestCases,
} from '../../../test-util/typeTestCases';
import { Effect, pipe } from 'effect';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import {
  isPathParameterDefaultImplementation,
  isPathParameterService,
} from '../../../compiler-plugin/request-types/isPathParameterService';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import {
  isQueryParameterDefaultImplementation,
  isQueryParameterService,
} from '../../../compiler-plugin/request-types/isQueryParameterService';
import {
  isRequestBodyDefaultImplementation,
  isRequestBodyService,
} from '../../../compiler-plugin/request-types/isRequestBodyService';
import {
  isRequestCookieDefaultImplementation,
  isRequestCookieService,
} from '../../../compiler-plugin/request-types/isRequestCookieService';
import {
  isRequestHeaderDefaultImplementation,
  isRequestHeaderService,
} from '../../../compiler-plugin/request-types/isRequestHeaderService';
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/pathParameter.ts');
tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/queryParameter.ts');
tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestBody.ts');
tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestCookie.ts');
tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestHeader.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`All request types are differentiable: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      "import { pathParameter } from './lib/request-types/pathParameter';\n" +
        "import { queryParameter } from './lib/request-types/queryParameter';\n" +
        "import { requestBody } from './lib/request-types/requestBody';\n" +
        "import { requestCookie } from './lib/request-types/requestCookie';\n" +
        "import { requestHeader } from './lib/request-types/requestHeader';\n\n" +
        (preStatement || '') +
        `const path = pathParameter<${type}, 'test0'>();\n` +
        `const query = queryParameter<${numTestCase[0]}, 'test1'>();\n` +
        `const body = requestBody<${booleanTestCase[0]}>();\n` +
        `const cookie = requestCookie<${booleanLiteralTestCase[0]}, 'test3'>();\n` +
        `const header = requestHeader<${stringTestCase[0]}, 'test4'>();\n`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isPathParameterService)(sourceFile),
      isPathParameterDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect('test0', predicate, t)
    );
    pipe(
      getIsServiceResultFromSourceFile(isQueryParameterService)(sourceFile),
      isQueryParameterDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect('test1', numTestCase[2], t)
    );
    pipe(
      getIsServiceResultFromSourceFile(isRequestBodyService)(sourceFile),
      isRequestBodyDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect(undefined, booleanTestCase[2], t)
    );
    pipe(
      getIsServiceResultFromSourceFile(isRequestCookieService)(sourceFile),
      isRequestCookieDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect('test3', booleanLiteralTestCase[2], t)
    );
    pipe(
      getIsServiceResultFromSourceFile(isRequestHeaderService)(sourceFile),
      isRequestHeaderDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect('test4', stringTestCase[2], t)
    );
  })
);
