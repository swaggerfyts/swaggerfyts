import test from 'ava';
import { Effect, pipe } from 'effect';
import { typeTestCases } from '../../../test-util/typeTestCases';
import { getIsServiceResultFromSourceFile } from '../../../test-util/compiler-plugin/request-types/getIsServiceResultFromSourceFile';
import { testIsServiceResultEffect } from '../../../test-util/compiler-plugin/request-types/testIsServiceResultEffect';
import { tsMorphProject } from '../../../test-util/tsMorphProject';
import {
  isQueryParameterDefaultImplementation,
  isQueryParameterService,
} from '../../../compiler-plugin/request-types/isQueryParameterService';
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

tsMorphProject.addSourceFileAtPath(__dirname + '/../../../lib/request-types/queryParameter.ts');

typeTestCases.forEach(([type, preStatement, predicate]) =>
  test(`Simple Test: ${type}`, t => {
    const sourceFile = tsMorphProject.createSourceFile(
      'test.ts',
      `import { queryParameter } from './lib/request-types/queryParameter'; ${
        preStatement || ''
      } const param = queryParameter<${type}, 'yxcv'>();`,
      { overwrite: true }
    );

    pipe(
      getIsServiceResultFromSourceFile(isQueryParameterService)(sourceFile),
      isQueryParameterDefaultImplementation,
      assumeAllServicesProvided,
      Effect.runSyncExit,
      testIsServiceResultEffect('yxcv', predicate, t)
    );
  })
);
