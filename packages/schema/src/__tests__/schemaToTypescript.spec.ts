import { createSchema } from '../Schema';
import { schemaToTypescript } from '../schemaToTypescript';

describe('schemaToTypescript', () => {
  it('works', async () => {
    const schema = createSchema({
      name: 'string',
      date: 'date',
      pointers: '[cursor]',
      bool: 'boolean?',
      ulids: '[ulid]?',
      dates: '[date]',
      sex: [{ enum: ['m', 'f', 'o'], optional: true }],
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
            week_days: { enum: ['0', '1', '2', '3', '4', '5', '6'] },
            name: {
              schema: {
                firstName: 'string',
                lastName: 'string',
              },
            },
          },
        },
      ],
    } as const)
      .describe('My Custom Schema')
      .describe({ name: 'person name', pointers: 'some pointers' });

    const ts = await schemaToTypescript('MySchema', schema);

    expect(ts).toMatchSnapshot();
  });
});
