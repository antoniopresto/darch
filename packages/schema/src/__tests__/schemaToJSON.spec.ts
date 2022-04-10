import { createSchema } from '../Schema';
import { schemaToJSON } from '../schemaToJSON';

describe('schemaToJSON', () => {
  it('works', async () => {
    const schema = createSchema({
      name: 'string',
      date: 'date',
      pointers: '[cursor]',
      bool: 'boolean?',
      ulids: '[ulid]?',
      dates: '[date]',
      sex: { enum: ['m', 'f', 'o'] },
      addresses: [
        {
          schema: {
            kind: { enum: ['home'] },
            street: 'string',
            number: ['string', 'float'],
          },
          optional: true,
          list: true,
          description: 'Home address',
        },
        {
          schema: {
            kind: { enum: ['work'] },
            weekDays: { enum: ['0', '1', '2', '3', '4', '5', '6'] },
          },
        },
      ],
    })
      .describe('My Custom Schema')
      .describe({ name: 'person name', pointers: 'some pointers' });

    const sut = schemaToJSON('MyTypeABX', schema);

    expect(sut).toEqual({
      additionalProperties: false,
      description: 'My Custom Schema',
      properties: {
        addresses: {
          anyOf: [
            {
              items: {
                additionalProperties: false,
                description: 'Home address',
                properties: {
                  kind: {
                    const: 'home',
                  },
                  number: {
                    anyOf: [
                      {
                        type: 'string',
                      },
                      {
                        type: 'number',
                      },
                    ],
                  },
                  street: {
                    type: 'string',
                  },
                },
                required: ['kind', 'street', 'number'],
                title: '',
                type: 'object',
              },
              type: 'array',
            },
            {
              additionalProperties: false,
              properties: {
                kind: {
                  const: 'work',
                },
                weekDays: {
                  enum: ['0', '1', '2', '3', '4', '5', '6'],
                  type: 'string',
                },
              },
              required: ['kind', 'weekDays'],
              title: '',
              type: 'object',
            },
          ],
        },
        bool: {
          type: 'boolean',
        },
        date: {
          format: 'date-time',
          tsType: 'Date',
          type: 'string',
        },
        dates: {
          items: {
            format: 'date-time',
            tsType: 'Date',
            type: 'string',
          },
          type: 'array',
        },
        name: {
          description: 'person name',
          type: 'string',
        },
        pointers: {
          items: {
            description: 'some pointers',
            tsType: 'Cursor',
            type: 'object',
          },
          type: 'array',
        },
        sex: {
          enum: ['m', 'f', 'o'],
          type: 'string',
        },
        ulids: {
          items: {
            tsType: 'Ulid',
            type: 'string',
          },
          type: 'array',
        },
      },
      required: ['name', 'date', 'pointers', 'dates', 'sex'],
      title: 'MyTypeABX',
      type: 'object',
    });
  });
});
