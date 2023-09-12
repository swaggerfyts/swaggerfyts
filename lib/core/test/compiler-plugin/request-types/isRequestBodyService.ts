import test from 'ava';
import { Effect, pipe } from 'effect';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import {
  isRequestBodyDefaultImplementation,
  isRequestBodyService,
} from '../../../compiler-plugin/request-types/isRequestBodyService';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/requestBody.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `import { requestBody } from './lib/request-types/requestBody'; ${
        preStatement || ''
      } const param = requestBody<${type}>();`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isRequestBodyService)(sourceFile),
      isRequestBodyDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect(undefined, predicate, t)
    );
  })
);
