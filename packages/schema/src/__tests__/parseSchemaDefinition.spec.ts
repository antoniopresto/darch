import { Schema } from '../Schema';
import { EnumField } from '../fields/EnumField';
import { parseSchemaDefinition } from '../parseSchemaDefinition';

describe('parseSchemaDefinition', () => {
  it('works', () => {
    const sut = parseSchemaDefinition({
      objectIntDef: {
        type: 'int',
      },
      string: 'string',
      stringOptional: 'string?',
      arrayString: '[string]',
      arrayStringOptional: '[string]?',
      enum: ['a', 'b'],
      fieldType: EnumField.create(['a', 'x']),
      fieldTypeOptional: EnumField.create(['a', 'x']).optional(),
      fieldTypeOptionalList: EnumField.create(['a', 'x']).list().optional(),
      schemaAsSingleKey: {
        schema: {
          name: 'string',
        },
      },
      unionAsSingleKey: {
        union: ['string', 'int?'],
      },
    });

    expect(sut).toEqual({
      arrayString: {
        list: true,
        optional: false,
        type: 'string',
      },
      arrayStringOptional: {
        list: true,
        optional: true,
        type: 'string',
      },
      enum: {
        def: ['a', 'b'],
        list: false,
        optional: false,
        type: 'enum',
      },
      fieldType: {
        def: ['a', 'x'],
        list: false,
        optional: false,
        type: 'enum',
      },
      fieldTypeOptional: {
        def: ['a', 'x'],
        list: false,
        optional: true,
        type: 'enum',
      },
      fieldTypeOptionalList: {
        def: ['a', 'x'],
        list: true,
        optional: true,
        type: 'enum',
      },
      objectIntDef: {
        list: false,
        optional: false,
        type: 'int',
      },
      string: {
        list: false,
        optional: false,
        type: 'string',
      },
      stringOptional: {
        list: false,
        optional: true,
        type: 'string',
      },
      schemaAsSingleKey: {
        def: {
          name: {
            list: false,
            optional: false,
            type: 'string',
          },
        },
        list: false,
        optional: false,
        type: 'schema',
      },
      unionAsSingleKey: {
        def: [
          {
            list: false,
            optional: false,
            type: 'string',
          },
          {
            list: false,
            optional: true,
            type: 'int',
          },
        ],
        description: '',
        list: false,
        optional: true,
        type: 'union',
      },
    });
  });

  it('parse schema', () => {
    const otherSchema = new Schema({
      foo: 'string',
      status: ['open', 'closed'],
    } as const);

    const sass = {
      union: [[{ schema: { points: '[float]?' } }, 'int']],
      names: '[string]?',
      age: 'int',
    };

    const sut = parseSchemaDefinition({
      name: 'string',
      schema: otherSchema,
      schemaList: {
        type: 'schema',
        def: otherSchema.definition,
        list: true,
      },
      schemaAsTypeList: {
        type: otherSchema,
        list: true,
      },
      schemaAsSchema: {
        schema: sass,
      },
      schemaAsSchemaList: {
        schema: sass,
        list: true,
      },
      schemaAsSchemaListOptional: {
        schema: sass,
        list: true,
        optional: true,
      },
    });

    const sassDef = {
      age: {
        list: false,
        optional: false,
        type: 'int',
      },
      names: {
        list: true,
        optional: true,
        type: 'string',
      },
      union: {
        def: [
          {
            def: {
              points: {
                list: true,
                optional: true,
                type: 'float',
              },
            },
            list: false,
            optional: false,
            type: 'schema',
          },
          {
            list: false,
            optional: false,
            type: 'int',
          },
        ],
        list: false,
        optional: false,
        type: 'union',
      },
    };

    expect(sut).toEqual({
      name: {
        type: 'string',
        list: false,
        optional: false,
      },
      schema: {
        def: otherSchema.definition,
        list: false,
        optional: false,
        type: 'schema',
      },
      schemaList: {
        def: otherSchema.definition,
        list: true,
        optional: false,
        type: 'schema',
      },
      schemaAsTypeList: {
        def: otherSchema.definition,
        list: true,
        optional: false,
        type: 'schema',
      },
      schemaAsSchema: {
        def: sassDef,
        list: false,
        optional: false,
        type: 'schema',
      },
      schemaAsSchemaList: {
        def: sassDef,
        list: true,
        optional: false,
        type: 'schema',
      },
      schemaAsSchemaListOptional: {
        def: sassDef,
        list: true,
        optional: true,
        type: 'schema',
      },
    });
  });
});
