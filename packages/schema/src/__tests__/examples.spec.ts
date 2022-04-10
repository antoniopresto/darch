import { createSchema } from '../Schema';
import { schemaToTypescript } from '../schemaToTypescript';
import { schemaToJSON } from '../schemaToJSON';
import { _assertFields } from '../fields/__tests__/__assert';

test('examples', async () => {
  const addressSchema = createSchema({
    street: 'string',
    number: ['string', 'int?'],
  });

  const userSchema = createSchema(
    {
      name: 'string', // any string
      email: 'email?', // email type - will validate against email regex
      age: 'int?', // optional integer
      notes: '[int]?',

      // declaring a union field - will infer as `string | undefined | number[]`
      unionField: ['string?', '[int]?'],

      // represents an enum
      letter: { enum: ['a', 'b', 'c'] },

      // more detailed way to define enums
      letterOptionalList: {
        enum: ['x', 'y', 'z'],
        optional: true,
        list: true,
      },

      // using a previous schema as field type
      optionalAddress: {
        schema: addressSchema,
        optional: true,
      },

      // another way to define schema fields
      deliveryAddress: {
        schema: {
          street: 'string',
          number: 'int?',
        },
      },
    } as const // "as const" is needed to TS to infer types correctly
  );

  expect(() => userSchema.parse({ name: 'Antonio', letter: 'x' })).toThrow(
    `field "letter": accepted: 'a' or 'b' or 'c', found x.`
  );

  expect(() =>
    userSchema.parse({ name: 'antonio', letter: 'a', deliveryAddress: {} })
  ).toThrow(
    'field "deliveryAddress": ➤ field "street": expected type string, found undefined.'
  );

  const parsed = userSchema.parse({
    name: 'antonio',
    letter: 'a',
    deliveryAddress: { street: 'alameda' },
  });

  type InferType = typeof parsed;

  _assertFields<
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
            number?: string | number | undefined;
          }
        | undefined;

      deliveryAddress: {
        street: string;
        number?: number | undefined;
      };
    }
  >(true);

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
    number?: string | number;
  };
  deliveryAddress: {
    street: string;
    number?: number;
  };
}
`
  );

  const jsonSchema = schemaToJSON('User', userSchema);

  expect(jsonSchema).toEqual({
    additionalProperties: false,
    properties: {
      age: {
        type: 'integer',
      },
      deliveryAddress: {
        additionalProperties: false,
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
      email: {
        tsType: 'Email',
        type: 'string',
      },
      letter: {
        enum: ['a', 'b', 'c'],
        type: 'string',
      },
      letterOptionalList: {
        items: {
          enum: ['x', 'y', 'z'],
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
      optionalAddress: {
        additionalProperties: false,
        properties: {
          number: {
            anyOf: [
              {
                type: 'string',
              },
              {
                type: 'integer',
              },
            ],
          },
          street: {
            type: 'string',
          },
        },
        required: ['street'],
        title: '',
        type: 'object',
      },
      unionField: {
        anyOf: [
          {
            type: 'string',
          },
          {
            items: {
              type: 'integer',
            },
            type: 'array',
          },
        ],
      },
    },
    required: ['name', 'letter', 'deliveryAddress'],
    title: 'User',
    type: 'object',
  });
});
