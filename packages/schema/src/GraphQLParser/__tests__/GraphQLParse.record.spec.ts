import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
} from 'graphql';

import { createSchema } from '../../Schema';

describe('GraphQLParse.record', () => {
  const person = createSchema('Person', {
    name: 'string',
    age: 'int?',
    addresses: { record: { type: 'string', keyType: 'int' } },
  });

  const record1 = createSchema('rec1', {
    addresses: { record: { type: '[string]', keyType: 'int' } },
  }).graphqlInputType();

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        person: {
          args: {
            rec: {
              type: record1,
            },
          },
          type: person.graphqlType(),
        },
      },
    }),
  });

  it('Should convert record', async () => {
    expect(printSchema(schema).split('\n')).toEqual([
      'type Query {',
      '  person(rec: rec1Input): Person',
      '}',
      '',
      'type Person {',
      '  name: String!',
      '  age: Int',
      '  addresses: Person_addressesRecord!',
      '}',
      '',
      'scalar Person_addressesRecord',
      '',
      'input rec1Input {',
      '  addresses: rec1_addressesRecord!',
      '}',
      '',
      'scalar rec1_addressesRecord',
    ]);

    await expect(
      graphql({
        schema,
        contextValue: {},
        source: '{ person { addresses } }',
        rootValue: {
          person: {
            addresses: [],
          },
        },
      })
    ).resolves.toMatchObject({
      errors: [
        {
          message:
            'Expected value to be of type "object", found array instead.',
        },
      ],
    });

    await expect(
      graphql({
        schema,
        contextValue: {},
        source: '{ person { addresses } }',
        rootValue: {
          person: {
            addresses: {
              abc: 1,
            },
          },
        },
      })
    ).resolves.toMatchObject({
      errors: [
        {
          message:
            'Unexpected record key `abc`. Expected value to be of type "number", found string instead.',
        },
      ],
    });
  });

  it('Should serialize output', async () => {
    await expect(
      graphql({
        schema,
        contextValue: {},
        source: '{ person(rec: {addresses: "__INVALID123__"}) { addresses } }',
        rootValue: {
          person: {
            addresses: {},
          },
        },
      })
    ).resolves.toMatchObject({
      errors: [
        {
          message: expect.stringMatching(
            'Expected value to be of type "object", found string instead.'
          ),
        },
      ],
    });
  });
});
