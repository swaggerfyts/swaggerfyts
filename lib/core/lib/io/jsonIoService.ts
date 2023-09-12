import { Context, Effect } from 'effect';
import { JsonSerializeError } from '../errors/JsonSerializeError';
import { JsonParseError } from '../errors/JsonParseError';

export interface JsonIoService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly serialize: (jsonUnserialized: any) => Effect.Effect<unknown, JsonSerializeError, string>;
  readonly parse: (jsonSerialized: string) => Effect.Effect<unknown, JsonParseError, unknown>;
}

export const jsonIoService = Context.Tag<JsonIoService>();

export const jsonIoServiceDefaultImplementation = Effect.provideService(
  jsonIoService,
  jsonIoService.of({
    parse: jsonSerialized => {
      try {
        return Effect.succeed(JSON.parse(jsonSerialized));
      } catch (e) {
        if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
          return Effect.fail(new JsonParseError(e.message));
        }
        try {
          return Effect.fail(new JsonParseError(`Unknown error: ${JSON.stringify(e)}`));
        } catch {
          return Effect.fail(new JsonParseError('Unknown error'));
        }
      }
    },
    serialize: jsonUnserialized => {
      try {
        return Effect.succeed(JSON.stringify(jsonUnserialized));
      } catch (e) {
        if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
          return Effect.fail(new JsonSerializeError(e.message));
        }
        try {
          return Effect.fail(new JsonSerializeError(`Unknown error: ${JSON.stringify(e)}`));
        } catch {
          return Effect.fail(new JsonSerializeError('Unknown error'));
        }
      }
    },
  })
);
