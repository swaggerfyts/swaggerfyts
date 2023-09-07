import test from 'ava';
import { Node, Project, SourceFile, Type } from 'ts-morph';
import { Effect, Exit, Option, pipe, ReadonlyArray } from 'effect';
import {
  isRequestParameterDefaultImplementation,
  isRequestParameterService,
} from '../../../compiler-plugin/request-types/isRequestParameterService';

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  tsConfigFilePath: __dirname + '/../../../tsconfig.json',
  compilerOptions: {
    noEmit: true,
  },
});

project.addSourceFileAtPath(__dirname + '/../../../lib/request-types/createPathParameter.ts');

const getRequestParameterResults = Effect.serviceFunctionEffect(
  isRequestParameterService,
  isRequestParameter => (sourceFile: SourceFile) =>
    pipe(
      Effect.succeed(sourceFile),
      //Effect<isRequestParameterService, never, SourceFile>
      Effect.map(sourceFile => sourceFile.getDescendants()),
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

test('Simple test', t => {
  const sourceFile = project.createSourceFile(
    'simpleTest.ts',
    "import { createPathParameter } from './lib/request-types/createPathParameter'; createPathParameter<number, 'asdf'>();"
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
        t.is(results[0]!.name, 'asdf');
        t.is(results[0]!.intersectionType.length, 1);
        t.true(results[0]!.intersectionType[0]!.isNumber());
      },
    })
  );
});
