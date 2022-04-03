import { RuntimeError } from '@darch/utils/dist/RuntimeError';
import { assert, IsExact } from 'conditional-type-checks';

import { createSchema } from '../../Schema';
import { Infer, ParsedFieldDefinition, Infer } from '../../TSchemaParser';
import { UnionField } from '../UnionField';

describe('Union', () => {
  it('parses', () => {
    expect(() => UnionField.create(['string', 'int']).parse(undefined)).toThrow('Required field');

    expect(() => {
      return UnionField.create(['string', 'int']).parse(null);
    }).toThrow('Expected value to match one of the following types: string or int.');

    expect(UnionField.create(['string', 'int']).parse(1)).toEqual(1);
    expect(UnionField.create(['string', 'int']).parse('a')).toEqual('a');
    expect(UnionField.create(['string', 'int']).toList().parse([2, 'x'])).toEqual([2, 'x']);

    expect(() => UnionField.create(['int?']).parse('ZZ', (v) => `${v}?`)).toThrowError(
      new RuntimeError('ZZ?', { input: 'ZZ' })
    );
  });

  it('should parse union with schema', async () => {
    const schema1 = createSchema({ name: 'string' });
    const schema2 = createSchema({ sub: schema1 });
    const schema3 = createSchema({ sub: schema2 });
    const sut = UnionField.create([schema3, schema1]).toList();

    expect(() => sut.parse([2, 'x'])).toThrow('Expected value to match one of the following types: schema.');

    expect(() => sut.parse([{ name: 1 }])).toThrow(
      '➤ field "sub": expected type schema, found undefined. at position 0'
    );

    expect(sut.parse([{ name: 'antonio' }, { sub: { sub: { name: 'antonio' } } }])).toEqual([
      { name: 'antonio' },
      { sub: { sub: { name: 'antonio' } } },
    ]);

    expect(() => sut.parse([{ name: 'antonio' }, { sub: { sub: 1 } }])).toThrow(
      '➤ field "sub": ➤ field "sub": expected object, found number. at position 1'
    );
  });

  test('union as array definition', async () => {
    const subSchema = createSchema({ name: 'string' });

    const sut = createSchema({
      foo: [['[string]?', subSchema]],
    } as const);

    expect(sut.parse({ foo: undefined })).toEqual({ foo: undefined });

    expect(() => sut.parse({ foo: 'a' })).toThrow(
      'field "foo": Expected value to match one of the following types: string or schema.'
    );

    expect(sut.parse({ foo: { name: 'a' } })).toEqual({ foo: { name: 'a' } });

    type T = Infer<typeof sut>;

    assert<
      IsExact<
        T,
        {
          foo?: string[] | undefined | { name: string };
        }
      >
    >(true);
  });

  test('types', () => {
    const def = {
      uu: [['int?', 'boolean']],

      nameFromType: UnionField.create(['string']).toList().optional(),

      nameOrUndefinedListFromType: UnionField.create(['string?']).toList().optional(),

      defObject: {
        type: 'union',
        optional: true,
        list: true,
        def: ['string', 'boolean'],
      },
    } as const;

    // type S = ParsedFieldDefinition<[['[string]?']]>;
    // type T = TypeFromSchema<{ name: S }>;

    // const gql = schemaToGQL('TempUnionField', def);

    // expect(gql.toSDL()).toEqual(
    //   'type TempUnionField {\n' +
    //     '  name: TempUnionFieldNameEnum!\n' +
    //     '  nameFromType: [TempUnionFieldNameFromTypeEnum]\n' +
    //     '  defObject: [TempUnionFieldDefObjectEnum]\n' +
    //     '}'
    // ); // TODO

    type T = Infer<typeof def>;

    assert<
      IsExact<
        T,
        {
          uu?: number | boolean | undefined;
          nameOrUndefinedListFromType?: (string | undefined)[] | undefined;
          nameFromType?: string[] | undefined;
          defObject?: (string | boolean)[] | undefined;
        }
      >
    >(true);
  });

  test('complex parsing', () => {
    const schema = createSchema({
      union1: { union: ['boolean', ['true', 'false']] },
      union1Optional: { union: ['boolean?', ['true', 'false']] },
      union1OptionalList: { union: ['boolean?', ['true', 'false']], list: true },
      union2: [['boolean', ['true', 'false']]],
      union2Optional: [['boolean?', ['true', 'false']]],
      union3: {
        type: 'union',
        def: [['true', 'false'], 'boolean'],
      },
      union3Optional: {
        type: 'union',
        def: [['true', 'false'], 'boolean'],
        optional: true,
      },
      union3ListOptional: {
        type: 'union',
        def: [['true', 'false'], 'boolean'],
        optional: true,
        list: true,
      },
      union4ListOptional: {
        type: 'union',
        def: [['true', 'false'], 'boolean?'],
        optional: false,
        list: true,
      },
    } as const);

    expect(schema.definition).toEqual({
      union1: {
        def: [
          {
            list: false,
            optional: false,
            type: 'boolean',
          },
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
        ],
        description: '',
        list: false,
        optional: false,
        type: 'union',
      },
      union1Optional: {
        def: [
          {
            list: false,
            optional: true,
            type: 'boolean',
          },
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
        ],
        description: '',
        list: false,
        optional: true,
        type: 'union',
      },
      union1OptionalList: {
        def: [
          {
            list: false,
            optional: true,
            type: 'boolean',
          },
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
        ],
        description: '',
        list: true,
        optional: true,
        type: 'union',
      },
      union2: {
        def: [
          {
            list: false,
            optional: false,
            type: 'boolean',
          },
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
        ],
        list: false,
        optional: false,
        type: 'union',
      },
      union2Optional: {
        def: [
          {
            list: false,
            optional: true,
            type: 'boolean',
          },
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
        ],
        list: false,
        optional: true,
        type: 'union',
      },
      union3: {
        def: [
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
          {
            list: false,
            optional: false,
            type: 'boolean',
          },
        ],
        list: false,
        optional: false,
        type: 'union',
      },
      union3ListOptional: {
        def: [
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
          {
            list: false,
            optional: false,
            type: 'boolean',
          },
        ],
        list: true,
        optional: true,
        type: 'union',
      },
      union3Optional: {
        def: [
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
          {
            list: false,
            optional: false,
            type: 'boolean',
          },
        ],
        list: false,
        optional: true,
        type: 'union',
      },
      union4ListOptional: {
        def: [
          {
            def: ['true', 'false'],
            list: false,
            optional: false,
            type: 'enum',
          },
          {
            list: false,
            optional: true,
            type: 'boolean',
          },
        ],
        list: true,
        optional: false,
        type: 'union',
      },
    });

    type QBool = 'true' | 'false' | boolean;

    type TSchema = {
      union1: QBool;
      union1Optional?: QBool;
      union1OptionalList?: QBool[];
      union2: QBool;
      union3: QBool;
      union2Optional?: QBool;
      union3Optional?: QBool;
      union3ListOptional?: QBool[];
    };

    const random = (array = ['true', 'false', true, false] as const) => array[Math.floor(Math.random() * array.length)];

    const valid = (): TSchema => {
      const val = {
        union1: random(),
        union1Optional: random(),
        union1OptionalList: [random()],
        union2: random(),
        union3: random(),
        union2Optional: random(),
        union3Optional: random(),
        union3ListOptional: [random()],
        union4ListOptional: [random()],
      };

      return val;
    };

    schema.parse(valid());
    schema.parse(valid());
    schema.parse(valid());
    schema.parse(valid());
    schema.parse(valid());
    schema.parse({
      ...valid(),
      union3ListOptional: undefined,
      union1OptionalList: undefined,
      union1Optional: undefined,
    });
  });

  describe('infer', () => {
    it('infer array union with schema inside', () => {
      const schema1 = createSchema({ a: 'string?' });

      const u = [['int?', schema1]] as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int?' | typeof schema1, P['def'][number]>>(true);
    });

    it('infer array union with optional as optional', () => {
      const u = [['int?', 'string']] as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int?' | 'string', P['def'][number]>>(true);
    });

    it('infer array union without optional as required', () => {
      const u = [['int', 'string']] as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(false);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int' | 'string', P['def'][number]>>(true);
    });

    it('infer object union with optional as optional', () => {
      const u = { type: 'union', def: ['int?', 'string'] } as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int?' | 'string', P['def'][number]>>(true);
    });

    it('respect object union with optional: true as optional', () => {
      const u = { type: 'union', def: ['int', 'string'], optional: true } as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int' | 'string', P['def'][number]>>(true);
    });

    it('infer object union without optional as required', () => {
      const u = { type: 'union', def: ['int', 'string'] } as const;
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(false);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int' | 'string', P['def'][number]>>(true);
    });

    it('respect FieldType union with isOptional: true as optional', () => {
      const u = UnionField.create(['string', 'int']).optional();
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int' | 'string', P['def'][number]>>(true);
    });

    it('infer FieldType union with optional', () => {
      const u = UnionField.create(['string', 'int?']);
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(true);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int?' | 'string', P['def'][number]>>(true);
    });

    it('infer FieldType union without optional as required', () => {
      const u = UnionField.create(['string', 'int']);
      type P = ParsedFieldDefinition<typeof u>;

      assert<IsExact<true, P['optional']>>(false);
      assert<IsExact<'union', P['type']>>(true);
      assert<IsExact<'int' | 'string', P['def'][number]>>(true);
    });

    it('infer union from schema', () => {
      const schema = createSchema({
        union1: { union: ['boolean', ['true', 'false']] },
        union1Optional: { union: ['boolean?', ['true', 'false']] },
        union1OptionalList: { union: ['boolean?', ['true', 'false']], list: true },
        union2: [['boolean', ['true', 'false']]],
        union2Optional: [['boolean?', ['true', 'false']]],
        union3: {
          type: 'union',
          def: [['true', 'false'], 'boolean'],
        },
        union3Optional: {
          type: 'union',
          def: [['true', 'false'], 'boolean'],
          optional: true,
        },
        union3ListOptional: {
          type: 'union',
          def: [['true', 'false'], 'boolean'],
          optional: true,
          list: true,
        },
        union4ListOptional: {
          type: 'union',
          def: [['true', 'false'], 'boolean?'], // list containing undefined | boolean | 'true' | 'false'
          optional: false,
          list: true,
        },
        union5ListOptional: {
          type: 'union',
          def: [
            {
              enum: ['true', 'false'],
            },
            'boolean?', // list containing undefined | boolean | 'true' | 'false'
          ],
          optional: false,
          list: true, // list
        },
      } as const);

      type QBool = 'true' | 'false' | boolean;

      type TSchema = {
        union1: QBool;
        union1Optional?: QBool | undefined;
        union1OptionalList?: (QBool | undefined)[] | undefined;
        union2: QBool;
        union3: QBool;
        union2Optional?: QBool;
        union3Optional?: QBool;
        union3ListOptional?: QBool[] | undefined;
        union4ListOptional: (QBool | undefined)[]; // list containing undefined | boolean | 'true' | 'false'
        union5ListOptional: (QBool | undefined)[]; // list containing undefined | boolean | 'true' | 'false'
      };

      type SchemaInferred = Infer<typeof schema>;

      assert<IsExact<SchemaInferred, TSchema>>(true);

      const schema2 = createSchema({
        a: { union: [schema, 'string'] },
        b: { union: [schema, '[string]?'] },
      } as const);

      type TSchema2 = {
        a: TSchema | string;
        b?: TSchema | string[] | undefined;
      };

      type Schema2Inferred = Infer<typeof schema2>;

      assert<IsExact<Schema2Inferred, TSchema2>>(true);
    });
  });
});
