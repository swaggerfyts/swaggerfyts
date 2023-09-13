import {ParameterSerializationStrategies} from "./io/util/ParameterSerializationStrategies";
import {parameterSerializationService, SerializationStrategies} from "./io/parameterSerializationService";
import {Context, Effect} from "effect";
import {parameterParseService} from "./io/parameterParseService";

export type Config = {
  /**
   * Define how parameters should be serialized in Requests, see https://swagger.io/docs/specification/serialization/.
   * By default, the is set to the first value of parameterParseService.supportedSerializationStrategies
   */
  defaultRequestParameterSerializationStrategy: {
    readonly [key0 in keyof ParameterSerializationStrategies]: {
      readonly [key1 in keyof ParameterSerializationStrategies[key0]]: ParameterSerializationStrategies[key0][key1] extends Array<infer I> ? I : never;
    }
  },
  /**
   * Define how parameters should be serialized in Responses, see https://swagger.io/docs/specification/serialization/.
   * By default, the is set to the first value of parameterSerializeService.supportedSerializationStrategies
   */
  defaultResponseParameterSerializationStrategy: {
    readonly [key0 in keyof SerializationStrategies]: {
      readonly [key1 in keyof SerializationStrategies[key0]]: SerializationStrategies[key0][key1] extends Array<infer I> ? I : never;
    }
  },
  /**
   * Makes parameter parsing (see parameterParseService) try all supported strategies, instead of only the defined
   * strategy.
   * Default: false
   */
  strictParameterParsing: boolean,
  /**
   * Specifies the behavior of the compiler plugin when detecting a non-compliant header name.
   * The behavior at runtime is determined by the web-framework.
   * Characters that are not alphanumeric, - or _ are considered non-compliant.
   * Default: 'fail'
   */
  nonCompliantHeaderNames: 'ignore' | 'warn' | 'fail',
  /**
   * Specifies the behavior of the compiler plugin when detecting a non-compliant header value.
   * The behavior at runtime is determined by the web-framework.
   * Characters that are not alphanumeric, or one of _ :;.,\/"'?!(){}[]@<>=-+*#$&`|~^% are considered non-compliant.
   * Default: 'fail'
   */
  nonCompliantHeaderValues: 'ignore' | 'warn' | 'fail',
  /**
   * Specifies the behavior of the compiler plugin when detecting a non-compliant cookie name.
   * The behavior at runtime is determined by the web-framework.
   * Characters that are not alphanumeric, or one of !#$%&'*+-.~^_ are considered non-compliant.
   * Default: 'fail'
   */
  nonCompliantCookieNames: 'ignore' | 'warn' | 'fail',
  /**
   * Specifies the behavior of the compiler plugin when detecting a non-compliant cookie value.
   * The behavior at runtime is determined by the web-framework.
   * Characters that are not alphanumeric, or one of !#$%&'()*+-./:<=>?`[~]^_@{} are considered non-compliant.
   * Default: 'fail'
   */
  nonCompliantCookieValues: 'ignore' | 'warn' | 'fail',
}

export interface ConfigServiceType {
  set: (newConfig: Partial<Config>) => void;
  get: <const Key extends keyof Config>(key: Key) => Effect.Effect<unknown, never, Config[Key]>;
}

export const configService = Context.Tag<ConfigServiceType>();

let currentConfig: { [key in keyof Config]: Effect.Effect<unknown, never, Config[key]> } = {
  defaultRequestParameterSerializationStrategy: parameterParseService.pipe(
    Effect.map(service => service.supportedSerializationStrategies),
    Effect.map(supportedSerializationStrategies => ({
      pathParameter: {
        primitive: supportedSerializationStrategies.pathParameter.primitive[0],
        array: supportedSerializationStrategies.pathParameter.array[0],
        object: supportedSerializationStrategies.pathParameter.object[0],
      },
      queryParameter: {
        primitive: supportedSerializationStrategies.queryParameter.primitive[0],
        array: supportedSerializationStrategies.queryParameter.array[0],
        object: supportedSerializationStrategies.queryParameter.object[0],
      },
      header: {
        primitive: supportedSerializationStrategies.header.primitive[0],
        array: supportedSerializationStrategies.header.array[0],
        object: supportedSerializationStrategies.header.object[0],
      },
      cookie: {
        primitive: supportedSerializationStrategies.cookie.primitive[0],
        array: supportedSerializationStrategies.cookie.array[0],
        object: supportedSerializationStrategies.cookie.object[0],
      },
    })),
  ),
  defaultResponseParameterSerializationStrategy: parameterSerializationService.pipe(
    Effect.map(service => service.supportedSerializationStrategies),
    Effect.map(supportedSerializationStrategies => ({
      header: {
        primitive: supportedSerializationStrategies.header.primitive[0],
        array: supportedSerializationStrategies.header.array[0],
        object: supportedSerializationStrategies.header.object[0],
      },
      cookie: {
        primitive: supportedSerializationStrategies.cookie.primitive[0],
        array: supportedSerializationStrategies.cookie.array[0],
        object: supportedSerializationStrategies.cookie.object[0],
      },
    })),
  ),
  strictParameterParsing: Effect.succeed(false),
  nonCompliantHeaderNames: Effect.succeed('fail'),
  nonCompliantHeaderValues: Effect.succeed('fail'),
  nonCompliantCookieNames: Effect.succeed('fail'),
  nonCompliantCookieValues: Effect.succeed('fail'),
}
const defaultImplementation = configService.of({
  set: (newConfig: Partial<Config>) => {
    for (const key of Object.keys(newConfig)) {
      // @ts-ignore
      currentConfig[key] = Effect.succeed(newConfig[key]);
    }
  },
  get: (key) => currentConfig[key],
});

export const configServiceDefaultImplementation = Effect.provideService(
  configService,
  defaultImplementation
);
