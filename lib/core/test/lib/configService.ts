import test from 'ava';
import {configService, configServiceDefaultImplementation} from "../../lib/configService";
import {Effect} from "effect";
import {assumeAllServicesProvided} from "../../lib/util/assumeAllServicesProvided";

test('config changes', t => {
  const initial = configService.pipe(
    Effect.flatMap(configService => configService.get('strictParameterParsing')),
    configServiceDefaultImplementation,
    assumeAllServicesProvided,
    Effect.runSync
  );

  t.false(initial);

  const changed = configService.pipe(
    Effect.flatMap(configService => {
      configService.set({strictParameterParsing: true});
      return configService.get('strictParameterParsing');
    }),
    configServiceDefaultImplementation,
    assumeAllServicesProvided,
    Effect.runSync
  );

  t.true(changed);
})
