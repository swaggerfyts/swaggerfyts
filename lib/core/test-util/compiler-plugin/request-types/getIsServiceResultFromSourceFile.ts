import { isQueryParameterService } from '../../../compiler-plugin/request-types/isQueryParameterService';
import { isRequestBodyService } from '../../../compiler-plugin/request-types/isRequestBodyService';
import { isRequestCookieService } from '../../../compiler-plugin/request-types/isRequestCookieService';
import { isRequestHeaderService } from '../../../compiler-plugin/request-types/isRequestHeaderService';
import { isRequestParameterService } from '../../../compiler-plugin/request-types/isRequestParameterService';
import { Effect, Option, pipe, ReadonlyArray } from 'effect';
import { Node, SourceFile, SyntaxKind, Type } from 'ts-morph';

export const getIsServiceResultFromSourceFile = <
  Service extends
    | typeof isRequestBodyService
    | typeof isQueryParameterService
    | typeof isRequestCookieService
    | typeof isRequestHeaderService
    | typeof isRequestParameterService,
>(
  service: Service
) =>
  Effect.serviceFunctionEffect(
    service,
    service => (sourceFile: SourceFile) =>
      pipe(
        Effect.succeed(sourceFile),
        //Effect<isRequestParameterService, never, SourceFile>
        Effect.map(sourceFile => sourceFile.getDescendants()),
        //Effect<isRequestParameterService, never, [Node, Node, ...]>
        Effect.map(ReadonlyArray.filter(node => node.isKind(SyntaxKind.CallExpression))),
        //Effect<isRequestParameterService, never, [Node, Node, ...]>
        Effect.map(ReadonlyArray.map(node => [node, node.getType()] satisfies [Node, Type])),
        //Effect<isRequestParameterService, never, [[Node, Type], [Node, Type], ...]>
        Effect.map(ReadonlyArray.map(([node, type]) => service(node, type))),
        //Effect<isRequestParameterService, never, [Effect<never, CompilerErrors, Option.Some<{name: string, intersectionType: Type}>>, Effect<never, CompilerErrors, Option.None<{name: string, intersectionType: Type}>>, ...]>
        Effect.flatMap(Effect.all),
        //Effect<isRequestParameterService, CompilerErrors, [Option.Some<{name: string, intersectionType: Type}>, Option.None<{name: string, intersectionType: Type}, ...]>
        Effect.map(ReadonlyArray.filter(Option.isSome)),
        //Effect<isRequestParameterService, CompilerErrors, [Option.Some<{name: string, intersectionType: Type}>, ...]>
        Effect.map(ReadonlyArray.map(option => option.value))
        //Effect<isRequestParameterService, CompilerErrors, [{name: string, intersectionType: Type}, ...]>
      )
  );
