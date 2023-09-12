import {Effect} from "effect";

export const assumeAllServicesProvided = <E, S>(effect: Effect.Effect<unknown, E, S>) => effect as Effect.Effect<never, E, S>;
