# SwaggerfyTs
### A web framework independent tool to generate OpenAPI specifications from typescript code
Author: MartinRamm

SwaggerfyTs is a tool which uses static code analysis to create a [OpenAPI (v. 3.1)](https://www.openapis.org)
specifications from [typescript](https://typescriptlang.org) code. It is built in a way that is web framework independent,
meaning that most frameworks can be supported. Furthermore it is highly customizable, meaning that you can easily
adapt the tool to your needs.

## Example
### Code:
```typescript
// src/db/pet.ts
export type PetId = number & {__brand: 'PetId'};
export type Pet = {
    id: PetId,
    name: string,
};
export const getPet(petId: PetId): Promise<Pet | null> = ...;
...

// .swaggerfy.ts
import type {PetId} from './src/db/pet.ts';
import {customType, jsonResponse} from 'swaggerfyts';
export const config = {
    ...,
    badRequestResponse: (validationErrors: string[]) => jsonResponse(400, {error: 400, type: 'BAD REQUEST', message: 'The following errors occurred:', errors: validationErrors}),
    customTypes: [
        ...,
        customType<PetId>('int64', {minimum: 0}), //now the type "PetId" is treated as a integer
    ],
}

// server.js
import type {PetId, Pet, getPet} from './src/db/pet.ts';
import type {User, findUserByApiKey} from './src/db/user.ts';
import express, { Express } from 'express';
import {swaggerfy, path, pathParam, header, security, jsonResponse} from '@swaggerfyts/express';

const app: Express = express();

const apiKey = header('X-API-KEY');
const apiKeyHeader = security({
    type: 'apiKey',
    handler: async (key: typeof apiKey) => {
        if (key.length === 0) {
            return jsonResponse(401, {error: 401.1, type: 'UNAUTHORIZED', message: 'Missing or empty header X-API-KEY.');
        }
        
        const user: User | null = await findUserByApiKey(apiKey);
        if (user === null) {
            return jsonResponse(401, {error: 401.2, type: 'UNAUTHORIZED', message: 'Given X-API-KEY is invalid or expired.');
        }
        
        return user;
    }
});

/**
 * ID of the pet to return.
 */
const petId = pathParam<PetId>('petId');      //using the previously registered custom type
/**
 * Find pet by ID. Returns a single pet.
 * @operationId: getPetById
 */
swaggerfy({
    app,
    path: path`GET /pet/${petId}`,
    security: apiKeyHeader, //can also be an array of security definitions
    handler: async (user: User, {petId}) => { //only executed if apiKeyHeader.handler returns a User.
        const pet: Pet = await getPet(petId);
        if (pet === null) {
            return jsonResponse(404, {error: 404, type: 'NOT FOUND', message: 'Resource not found.'}); 
        }
        
        if (!user.hasAccessTo(pet)) {
            return jsonResponse(403, {error: 403, type: 'FORBIDDEN', message: "You don't have permission to access the requested resource."});
        }

        /**
         * Single pet response.
         */
        return jsonResponse(200, pet);
    },
});

app.listen(...);
```

### OpenAPI Spec:
Running the command line tool on the example code above generates the 
[following file](https://github.com/swaggerfyts/swaggerfyts/blob/main/docs/exampleOutput.json), which you probably want to 
[open in the swagger editor](https://editor.swagger.io/?url=https://raw.githubusercontent.com/swaggerfyts/swaggerfyts/main/docs/exampleOutput.json)
to view.
```
## Credit
This tool is partially inspired from [TSOA](https://github.com/lukeautry/tsoa).

Furthermore, the author wants to give a shoutout to [ts-morph](https://github.com/dsherret/ts-morph), which made the
static code analysis (i.e. type resolving) an absolute blast.