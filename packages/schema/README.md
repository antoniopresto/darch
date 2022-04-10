# @darch/schema
Typescript schema validation with static type inference.

Schemas are a crucial part of a microservices architecture or a detachable application architecture (darch). 
They can serve as contracts between different pieces of an application (frontend, backend, forms) and different services.
So schemas should be **easily portable, written and read**, and that's the goal of this package.

![image](https://user-images.githubusercontent.com/6221799/151898179-2774489b-8905-4fdb-9575-023de9f3e19a.png)

# Installation

To install:

```sh
npm install @darch/schema
```

⚠️ IMPORTANT: You must enable `strict` mode in your `tsconfig.json`. This is a best practice for all TypeScript projects.

```ts
// tsconfig.json
{
  // ...
  "compilerOptions": {
    // ...
    "strict": true
  }
}
```

# Usage

### Schema
```ts
  const addressSchema = createSchema({
    street: 'string',
    number: 'int?',
  });

  const schemaDefinition = {
    name: 'string', // any string
    email: 'email?', // email type - will validate against email regex
    age: 'int?', // optional integer
    notes: '[int]?',

    // declaring an union
    unionField: [['string?', '[int]?']],

    // represents an enum
    letter: ['a', 'b', 'c'],

    // more detailed way to define enums
    letterOptionalList: {
      enum: ['x', 'y', 'z'],
      optional: true,
      list: true,
    },

    // using a previous schema as field type
    optionalAddress: {
      type: addressSchema,
      optional: true,
    },

    // another way to define schema fields
    deliveryAddress: {
      schema: {
        street: 'string',
        number: 'int?',
      },
    },
  } as const; // "as const" is needed to TS to infer types correctly

  const userSchema = createSchema(schemaDefinition);

  expect(() => userSchema.parse({ name: 'Antonio', letter: 'x' })).toThrow(
    `field "letter": accepted: 'a' or 'b' or 'c', found x.`
  );

  expect(() => userSchema.parse({ name: 'antonio', letter: 'a', deliveryAddress: {} })).toThrow(
    'field "deliveryAddress": ➤ field "street": expected type string, found undefined.'
  );

  const parsed = userSchema.parse({ name: 'antonio', letter: 'a', deliveryAddress: { street: 'alameda' } });

  type InferType = typeof parsed;

  assert<
    IsExact<
      InferType,
      {
        name: string;
        email?: string | undefined;
        age?: number | undefined;
        notes?: number[] | undefined;
        unionField?: string | number[] | undefined;
        letter: 'a' | 'b' | 'c';
        letterOptionalList?: ('x' | 'y' | 'z')[] | undefined;
        optionalAddress?:
          | {
              street: string;
              number?: number | undefined;
            }
          | undefined;

        deliveryAddress: {
          street: string;
          number?: number | undefined;
        };
      }
    >
  >(true);
```

### schemaToTypescript
Returns a string of an interface representing a DarchSchema;
``` ts
import { schemaToTypescript } from '@darch/schema/lib/schemaToTypescript';

const interfaceTxt = await schemaToTypescript('User', userSchema);

const interfaceTxt = await schemaToTypescript('User', userSchema);
expect(interfaceTxt).toBe(
    `/* tslint:disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND.
 */

export interface User {
  name: string;
  email?: Email;
  age?: number;
  notes?: number[];
  unionField?: string | number[];
  letter: "a" | "b" | "c";
  letterOptionalList?: ("x" | "y" | "z")[];
  optionalAddress?: {
    street: string;
    number?: number;
  };
  deliveryAddress: {
    street: string;
    number?: number;
  };
}`);
```

### schemaToJSON
Receives a DarchSchema and returns a [json-schema](https://json-schema.org/)

``` ts
  import { schemaToJSON } from '@darch/schema/lib/schemaToJSON';

  const jsonSchema = schemaToJSON('User', userSchema);

  expect(jsonSchema).toEqual({
    properties: {
      address: {
        properties: {
          number: {
            type: 'integer',
          },
          street: {
            type: 'string',
          },
        },
        required: ['street'],
        title: '',
        type: 'object',
      },
      age: {
        type: 'integer',
      },
      email: {
        tsType: 'Email',
        type: 'string',
      },
      letter: {
        enum: ['a', 'b', 'c'],
        title: 'EnumLetterUser',
        type: 'string',
      },
      letterOptionalList: {
        items: {
          enum: ['x', 'y', 'z'],
          title: 'Enum__subLetterOptionalList',
          type: 'string',
        },
        type: 'array',
      },
      name: {
        type: 'string',
      },
      notes: {
        items: {
          type: 'integer',
        },
        type: 'array',
      },
    },
    required: ['name', 'letter'],
    title: 'User',
    type: 'object',
  });
```

# TODO
- [ ] improve documentation
