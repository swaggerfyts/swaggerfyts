// eslint-disable-next-line ava/use-test
import { ExecutionContext } from 'ava';
import { Node, Type } from 'ts-morph';
import { FakeUnionOrIntersectionType } from '../../../compiler-plugin/request-types/util/FakeUnionOrIntersectionType';
import { Exit } from 'effect';
import { CompilerPluginError } from '../../../compiler-plugin/errors/CompilerPluginError';

export const testIsServiceResultEffect = (
  expectedName: string | undefined,
  predicate: (type: Type | FakeUnionOrIntersectionType, node: Node) => boolean,
  t: ExecutionContext<unknown>
) =>
  Exit.mapBoth({
    onFailure: (error: CompilerPluginError) => {
      t.log(error);
      t.fail();
    },
    onSuccess: (results: Array<{ name?: string; node: Node; type: Type | FakeUnionOrIntersectionType }>) => {
      t.is(results.length, 1);
      t.not(results[0], undefined);
      t.true('node' in results[0]!);
      t.is(results[0]!.name, expectedName);
      t.true(predicate(results[0]!.type, results[0]!.node));
    },
  });
