import test from 'ava';
import {
  DefaultParseContext,
  parameterParseService,
  parameterParseServiceDefaultImplementation,
  ParameterPosition
} from "../../../lib/io/parameterParseService";
import {tsMorphProject} from "../../../test-util/tsMorphProject";
import {Cause, Effect, Exit} from "effect";
import {assumeAllServicesProvided} from "../../../lib/util/assumeAllServicesProvided";

const positions: ParameterPosition[] = ['query parameter', 'path parameter', 'header', 'cookie'];

type TestCase = {
  typePrefix?: string;
  type: string;
  contextTest: (position: ParameterPosition) => DefaultParseContext | {errorClass: string; message: string;};
  parseTests?: Array<{
    test: string;
    position: ParameterPosition;
    result: {errorClass: string; message: string;} | unknown;
  }>;
  parseQueryStringTests?: Array<{
    test: string;
    result: {errorClass: string; message: string;} | unknown;
  }>;
}

const testCases: Array<TestCase> = [
  {
    type: 'any',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `any not supported in ${position}s (use string instead) at`})
  },
  {
    type: 'unknown',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `unknown not supported in ${position}s (use string instead) at`})
  },
  {
    type: 'never',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `never not supported in ${position}s (use string instead) at`})
  },
  {
    type: 'null',
    contextTest: (position) => ({position, result: 'null'}),
  },
  {
    type: 'Array<null>',
    contextTest: (position) => ({position, result: 'array_null'}),
  },
  {
    type: 'undefined',
    contextTest: (position) => ({position, result: 'null'}),
  },
  {
    type: 'Array<undefined>',
    contextTest: (position) => ({position, result: 'array_null'}),
  },
  {
    type: 'null | undefined',
    contextTest: (position) => ({position, result: 'null'}),
  },
  {
    type: 'Array<null | undefined>',
    contextTest: (position) => ({position, result: 'array_null'}),
  },
  {
    type: 'number',
    contextTest: (position) => ({position, result: 'number'}),
  },
  {
    type: 'Array<number>',
    contextTest: (position) => ({position, result: 'array_number'}),
  },
  {
    type: 'boolean',
    contextTest: (position) => ({position, result: 'boolean'}),
  },
  {
    type: 'true',
    contextTest: (position) => ({position, result: 'boolean'}),
  },
  {
    type: 'Array<boolean>',
    contextTest: (position) => ({position, result: 'array_boolean'}),
  },
  {
    type: 'Date',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'Array<Date>',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'string',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'Array<string>',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: '"str"',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'Array<"str">',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'string & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'string & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'Array<string & {__brand: "a"}>',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'Array<string> & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'Array<string> & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'Array<string & {__brand1: "a"} & {__brand2: "a"}>',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'number & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'number'}),
  },
  {
    type: 'number & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'number'}),
  },
  {
    type: 'Array<number & {__brand: "a"}>',
    contextTest: (position) => ({position, result: 'array_number'}),
  },
  {
    type: 'Array<number> & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'array_number'}),
  },
  {
    type: 'Array<number> & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'array_number'}),
  },
  {
    type: 'Array<number & {__brand1: "a"} & {__brand2: "a"}>',
    contextTest: (position) => ({position, result: 'array_number'}),
  },
  {
    type: 'boolean & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'boolean'}),
  },
  {
    type: 'boolean & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'boolean'}),
  },
  {
    type: 'Array<boolean & {__brand: "a"}>',
    contextTest: (position) => ({position, result: 'array_boolean'}),
  },
  {
    type: 'Array<boolean> & {__brand: "a"}',
    contextTest: (position) => ({position, result: 'array_boolean'}),
  },
  {
    type: 'Array<boolean> & {__brand1: "a"} & {__brand2: "a"}',
    contextTest: (position) => ({position, result: 'array_boolean'}),
  },
  {
    type: 'Array<boolean & {__brand1: "a"} & {__brand2: "a"}>',
    contextTest: (position) => ({position, result: 'array_boolean'}),
  },
  {
    type: '"a" | "b"',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'Array<"a" | "b">',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'string | number',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `union of different types (detected string, number) not supported in ${position}s at`})
  },
  {
    type: 'Array<string | number>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `in array: union of different types (detected string, number) not supported in ${position}s at`})
  },
  {
    type: '[string, "a" | "b"]',
    contextTest: (position) => ({position, result: 'array_string'}),
  },
  {
    type: 'Array<[string, "a" | "b"]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `multidimensional arrays not supported in ${position}s at`})
  },
  {
    type: '[string, number]',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `in tuple: union of different types (detected string, number) not supported in ${position}s at`})
  },
  {
    type: 'Array<[string, number]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `in array: in tuple: union of different types (detected string, number) not supported in ${position}s at`})
  },
  {
    type: '{ "a ": string; } & { b: number; } & { c: "c"; }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `intersection of different types (detected object_string, object_number, object_string) not supported in ${position}s at`})
  },
  {
    type: '{ "a ": string; } & { strLiteral: "a" | "b"; } & { str: string; }',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: 'Array<{ "a ": string; } & { strLiteral: "a" | "b"; } & { str: string; }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `array of objects not supported in ${position}s at`})
  },
  {
    type: 'STRING_ENUM',
    typePrefix: 'enum STRING_ENUM { A = "A", B = "B" };',
    contextTest: (position) => ({position, result: 'string'}),
  },
  {
    type: 'NUMBERED_ENUM',
    typePrefix: 'enum NUMBERED_ENUM { A = 2, B = 4 };',
    contextTest: (position) => ({position, result: 'number'}),
  },
  {
    type: 'INDEXED_ENUM',
    typePrefix: 'enum INDEXED_ENUM { A, B };',
    contextTest: (position) => ({position, result: 'number'}),
  },
  {
    type: '{"a[1]": true}',
    contextTest: (position) => position === 'query parameter'
      ? ({errorClass: 'TypeNotSupportedError', message: `object property a[1]: To enable compatibility with the "deepObject" serialization style, object property keys containing "[" are not supported in ${position}s at`})
      : ({position, result: 'object_boolean'})
  },
  {
    type: '{"a[": string}',
    contextTest: (position) => position === 'query parameter'
      ? ({errorClass: 'TypeNotSupportedError', message: `object property a[: To enable compatibility with the "deepObject" serialization style, object property keys containing "[" are not supported in ${position}s at`})
      : ({position, result: 'object_string'})
  },
  {
    type: '{"a]": number}',
    contextTest: (position) => position === 'query parameter'
      ? ({errorClass: 'TypeNotSupportedError', message: `object property a]: To enable compatibility with the "deepObject" serialization style, object property keys containing "]" are not supported in ${position}s at`})
      : ({position, result: 'object_number'})
  },
  {
    type: 'Record<string, string>',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: 'Record<string, Record<string, string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<string, { [key: string]: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<string, { [key: number]: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<string, { a: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<string, Record<"a", string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },

  {
    type: 'Record<number, Record<string, string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<number, { [key: string]: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<number, { [key: number]: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<number, { a: string }>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: 'Record<number, Record<"a", string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },

  {
    type: 'Record<"a", Array<string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<"a", Array<number>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<"a",  string[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<"a", number[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },

  {
    type: 'Record<string, Array<string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<string, Array<number>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<string,  string[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<string, number[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },

  {
    type: 'Record<number, Array<string>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<number, Array<number>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<number,  string[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: 'Record<number, number[]>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },

  {
    type: '{ [key: string]: string }',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: '{ [key: string]: Record<string, string }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: { [key: string]: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: { [key: number]: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: { a: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: Record<"a", string }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing subobject not supported in ${position}s at`})
  },

  {
    type: '{ [key: number]: Record<string, string }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: { [key: string]: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: { [key: number]: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: { a: string  }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: Record<"a", string }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing subobject not supported in ${position}s at`})
  },

  {
    type: '{ a: Array<string> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: '{ a: Array<number> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: '{ a:  string[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },
  {
    type: '{ a: number[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property a) containing array not supported in ${position}s at`})
  },

  {
    type: '{ [key: string]: Array<string> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: Array<number> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]:  string[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: number[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __StringIndexType) containing array not supported in ${position}s at`})
  },

  {
    type: '{ [key: number]: Array<string> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: Array<number> }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]:  string[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: number]: number[] }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object (property __NumberIndexType) containing array not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: string; }',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: 'Record<number, string>',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: '{ [key: number]: string; }',
    contextTest: (position) => ({position, result: 'object_string'}),
  },
  {
    type: 'Record<string, string> & Record<number, number>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `intersection of different types (detected object_string, object_number) not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: string; [key: number]: number; }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object values containing different types (__StringIndexType=string and __NumberIndexType=number) not supported in ${position}s at`})
  },
  {
    type: 'Record<string, never>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `empty object not supported in ${position}s at`})
  },
  {
    type: '{ [key: string]: never; }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `empty object not supported in ${position}s at`})
  },
  {
    type: 'Record<never, never>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `empty object not supported in ${position}s at`})
  },
  {
    type: '{ [key: never]: never; }',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `empty object not supported in ${position}s at`})
  },
  {
    type: '{a: Record<never, never>}',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object property a: empty object not supported in ${position}s at`})
  },
  {
    type: 'Record<"a", Record<never, never>>',
    contextTest: (position) => ({errorClass: 'TypeNotSupportedError', message: `object property a: empty object not supported in ${position}s at`})
  },
];

testCases.forEach((testCases, i) =>
  positions.forEach((position, j) =>
    test(`Context of ${testCases.type} (${i}) for position ${position} (${j})`, t => {
      const sourceFile = tsMorphProject.createSourceFile(
        'test.ts',
        `${testCases.typePrefix || ''}\nexport const test = null as unknown as ${testCases.type};`,
        { overwrite: true }
      );

      const node = sourceFile.getVariableDeclaration('test');
      if (node === undefined) {
        t.fail('Missing variable declaration');
        return;
      }
      const type = node.getType();

      parameterParseService.pipe(
        Effect.flatMap(service => service.getParserContext(position, type, node)),
        parameterParseServiceDefaultImplementation,
        assumeAllServicesProvided,
        Effect.runSyncExit,
        exit => {
          const expected = testCases.contextTest(position);
          if (Exit.isFailure(exit)) {
            const errors = Array.from(Cause.failures(exit.cause));
            if ('errorClass' in expected) {
              t.is(errors.length, 1)
              t.not(errors[0], undefined);
              t.is(errors[0]!.exactErrorName, expected.errorClass);
              t.true(errors[0]!.message.startsWith(expected.message), errors[0]!.message);
            } else {
              t.fail(JSON.stringify(errors));
            }
          } else {
            t.deepEqual(exit.value, expected);
          }
        }
      )
    })
  )
)
