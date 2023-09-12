import {ReadonlyArray} from "effect";

export type ParameterSerializationStrategies = {
  pathParameter: Record<
    'primitive' | 'array' | 'object',
    ReadonlyArray.NonEmptyArray<
      | {
      style: 'simple' | 'label' | 'matrix';
      explode: boolean;
    }
      | { content: string }
    >
  >;
  queryParameter: {
    primitive: ReadonlyArray.NonEmptyArray<
      | {
      style: 'form';
      explode: boolean;
    }
      | { content: string }
    >;
    array: ReadonlyArray.NonEmptyArray<
      | {
      style: 'form' | 'spaceDelimited' | 'pipeDelimited';
      explode: boolean;
    }
      | { content: string }
    >;
    object: ReadonlyArray.NonEmptyArray<
      | {
      style: 'form';
      explode: boolean;
    }
      | {
      style: 'deepObject';
      explode: true;
    }
      | { content: string }
    >;
  };
  header: Record<
    'primitive' | 'array' | 'object',
    ReadonlyArray.NonEmptyArray<
      | {
      style: 'simple';
      explode: boolean;
    }
      | { content: string }
    >
  >;
  cookie: {
    primitive: ReadonlyArray.NonEmptyArray<
      | {
      style: 'form';
      explode: boolean;
    }
      | { content: string }
    >;
  } & Record<
    'array' | 'object',
    ReadonlyArray.NonEmptyArray<
      | {
      style: 'form';
      explode: false;
    }
      | { content: string }
    >
  >;
};
