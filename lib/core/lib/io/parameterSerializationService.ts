import { Context, Effect, pipe, ReadonlyArray, ReadonlyRecord } from 'effect';
import { ParameterSerializeError } from '../errors/ParameterSerializeError';
import {ParameterSerializationStrategies} from "./util/ParameterSerializationStrategies";
import {Evaluate} from "../util/Evaluate";
import {JsonIoService, jsonIoService} from "./jsonIoService";

export type SerializationStrategies = Evaluate<Pick<ParameterSerializationStrategies, 'header' | 'cookie'>>;
export type SerializationStrategy = SerializationStrategies['header' | 'cookie']['object' | 'array' | 'primitive'][0];

export interface ParameterSerializationServiceType {
  readonly supportedSerializationStrategies: SerializationStrategies;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly serialize: (unserialized: any, serializationStrategy: SerializationStrategy) => Effect.Effect<JsonIoService, ParameterSerializeError, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parameterSerializationService = Context.Tag<ParameterSerializationServiceType>();

const defaultImplementation: ParameterSerializationServiceType = {
  supportedSerializationStrategies: {
    header: {
      primitive: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
        {
          content: 'application/json',
        }
      ],
      array: [
        {
          style: 'simple',
          explode: false,
        },
        {
          style: 'simple',
          explode: true,
        },
        {
          content: 'application/json',
        }
      ],
      object: [
        {
          style: 'simple',
          explode: true,
        },
        {
          style: 'simple',
          explode: false,
        },
        {
          content: 'application/json',
        }
      ],
    },
    cookie: {
      primitive: [
        {
          style: 'form',
          explode: false,
        },
        {
          style: 'form',
          explode: true,
        },
        {
          content: 'application/json',
        }
      ],
      array: [
        {
          style: 'form',
          explode: false,
        },
      ],
      object: [
        {
          style: 'form',
          explode: false,
        },
      ],
    },
  },
  serialize: (unserialized, strategy) => {
    if ('content' in strategy) {
      if (strategy.content !== 'application/json') {
        return Effect.fail(new ParameterSerializeError(`Serialization strategy not supported: ${JSON.stringify(strategy)}`));
      }

      return jsonIoService.pipe(
        Effect.flatMap(json => json.serialize(unserialized)),
        Effect.mapError(jsonError => {
          const newError = new ParameterSerializeError(jsonError.message);
          newError.previousError = jsonError;
          return newError;
        }),
      );
    }

    if (typeof unserialized === 'function') {
      return Effect.fail(new ParameterSerializeError('Functions cannot be serialized!'));
    }
    if (typeof unserialized === 'symbol') {
      return Effect.fail(new ParameterSerializeError('Symbols cannot be serialized!'));
    }

    if (typeof unserialized === 'boolean') {
      return Effect.succeed(unserialized ? 'true' : 'false');
    }

    if (typeof unserialized === 'number') {
      if (Number.isNaN(unserialized)) {
        return Effect.fail(new ParameterSerializeError('Number "NaN" cannot be serialized!'));
      }
      if (!Number.isFinite(unserialized)) {
        return Effect.fail(new ParameterSerializeError('Infinite number cannot be serialized!'));
      }

      return pipe(unserialized, JSON.stringify, Effect.succeed);
    }

    if (unserialized === null || unserialized === undefined) {
      return Effect.succeed('');
    }

    if (Array.isArray(unserialized)) {
      return pipe(
        unserialized,
        // [1, {'c': true}, false]
        ReadonlyArray.map(part => defaultImplementation.serialize(part, strategy)),
        // [Effect<..., ..., '1'>, Effect<..., ..., 'c=true'>, Effect<..., ..., 'false'>]
        Effect.all,
        // Effect<..., ..., ['1', 'c=true', 'false]>
        Effect.map(ReadonlyArray.join(','))
        // Effect<..., ..., '1,c=true,false'>
      );
    }

    if (typeof unserialized === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ('toJSON' in unserialized && typeof unserialized.toJSON === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return defaultImplementation.serialize(unserialized.toJSON(), strategy);
      }

      return pipe(
        unserialized,
        // {'a ': 1, b: {c: true}, [Symbol()]: 'hidden'}
        ReadonlyRecord.toEntries,
        // [['a ', 1], ['b', {'c': true}]]
        ReadonlyArray.map(ReadonlyArray.map(i => defaultImplementation.serialize(i, strategy))),
        // [[Effect.all<..., ..., 'a '>, Effect.all<..., ..., '1'>], [Effect.all<..., ..., 'b', Effect.all<..., ..., 'c=true'>]]
        ReadonlyArray.map(tuple => Effect.all(tuple)),
        // [Effect.all<..., ..., ['a ', '1']>, Effect.all<..., ..., ['b', 'c=true']>]
        Effect.all,
        // Effect<..., ..., [['a ', '1'], ['b', 'c=true']]>
        Effect.map(ReadonlyArray.map(ReadonlyArray.join(strategy.explode ? '=' : ','))),
        // Effect<..., ..., ['a =1', 'b=c=true']>
        Effect.map(ReadonlyArray.join(','))
        // Effect<..., ..., 'a =1,b=c=true'>
      );
    }

    if (typeof unserialized === 'string') {
      return Effect.succeed(unserialized);
    }

    return Effect.fail(
      new ParameterSerializeError(
        `Unhandled typeof: "${typeof unserialized}". This is a bug in swaggerfyts, please report it.`
      )
    );
  },
};
export const parameterSerializationServiceDefaultImplementation = Effect.provideService(
  parameterSerializationService,
  parameterSerializationService.of(defaultImplementation)
);
