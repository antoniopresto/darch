import { createSchema } from '../Schema';
import { EnumField } from '../fields/EnumField';
import { schemaMetaFieldKey } from '../fields/MetaFieldField';
import {
  parseFlattenFieldDefinition,
  parseSchemaField,
} from '../parseSchemaDefinition';

import { schemaMocks } from './__mock__';

const { typeDefs, stringDefTypes, schema2 } = schemaMocks;

describe('parseSchemaField', () => {
  test('parseFlattenFieldDefinition', () => {
    expect(parseFlattenFieldDefinition(EnumField.create(['a', 'b']))).toEqual(
      false
    );
    expect(parseFlattenFieldDefinition('string')).toEqual(false);
    expect(parseFlattenFieldDefinition({ type: 'string' })).toEqual(false);
    expect(
      parseFlattenFieldDefinition({
        gender: {
          type: 'enum',
          def: ['male', 'female', 'other'],
          optional: true,
        },
      })
    ).toEqual(false);

    expect(
      parseFlattenFieldDefinition({
        schema: {
          name: 'string',
        },
      })
    ).toEqual({
      def: {
        name: {
          list: false,
          optional: false,
          type: 'string',
        },
        [schemaMetaFieldKey]: expect.anything(),
      },
      description: undefined,
      list: false,
      optional: false,
      type: 'schema',
    });

    expect(
      parseFlattenFieldDefinition({
        string: {
          min: 1,
        },
        list: true,
        optional: true,
      })
    ).toEqual({
      def: {
        min: 1,
      },
      description: undefined,
      list: true,
      optional: true,
      type: 'string',
    });

    expect(
      parseFlattenFieldDefinition({
        string: {
          min: 1,
        },
        description: true, // <-- invalid
      })
    ).toEqual(false);

    const spyWarn = jest.spyOn(console, 'warn');
    expect(spyWarn).toBeCalledTimes(0);
    expect(
      parseFlattenFieldDefinition({
        string: {
          type: 'enum',
          def: ['male', 'female', 'other'],
          optional: true,
        },
      })
    ).toEqual(false);
    expect(spyWarn).toBeCalledTimes(1);
  });

  test('enumStringArray', () => {
    const sut = parseSchemaField('enumStringArray', {
      enum: ['a', 'b', 'c'],
    } as const);

    expect(sut).toEqual({
      type: 'enum',
      optional: false,
      list: false,
      def: ['a', 'b', 'c'],
    });
  });

  test('enum FieldType', () => {
    const single = parseSchemaField(
      'enum FieldType',
      EnumField.create(['a', 'b'])
    );
    const list = parseSchemaField(
      'enum FieldType',
      EnumField.create(['a', 'b']).toList()
    );
    const listOptional = parseSchemaField(
      'enum FieldType',
      EnumField.create(['a', 'b']).toList().toOptional()
    );

    expect(single).toEqual({
      type: 'enum',
      optional: false,
      list: false,
      def: ['a', 'b'],
    });

    expect(list).toEqual({
      type: 'enum',
      optional: false,
      list: true,
      def: ['a', 'b'],
    });

    expect(listOptional).toEqual({
      type: 'enum',
      optional: true,
      list: true,
      def: ['a', 'b'],
    });
  });

  test('schemaTypeName', () => {
    const sut = parseSchemaField('schemaTypeName', {
      type: 'schema',
      def: schema2['definition'],
    });

    expect(sut).toEqual({
      list: false,
      optional: false,
      type: 'schema',
      def: {
        [schemaMetaFieldKey]: expect.anything(),
        name: {
          list: false,
          optional: false,
          type: 'string',
        },
        sub: {
          list: false,
          optional: false,
          type: 'schema',

          def: {
            [schemaMetaFieldKey]: expect.anything(),
            name: {
              list: false,
              optional: false,
              type: 'string',
            },
            age: {
              list: false,
              optional: true,
              type: 'int',
            },
            favorites: {
              list: true,
              optional: false,
              type: 'string',
            },
            sex: {
              def: ['m', 'f', 'o'],
              list: false,
              optional: false,
              type: 'enum',
            },
          },
        },
      },
    });

    expect(
      parseSchemaField('schemaTypeName', {
        type: 'schema',
        def: schema2['definition'],
        list: true,
      })
    ).toHaveProperty('list', true);

    expect(
      parseSchemaField('schemaTypeName', {
        type: 'schema',
        def: schema2['definition'],
        optional: true,
      })
    ).toHaveProperty('optional', true);
  });

  test('schemaObjectAsType', () => {
    const sut = parseSchemaField(
      'schemaObjectAsType',
      typeDefs.schemaObjectAsType // deprecated
    );

    expect(sut).toEqual({
      list: true,
      optional: true,
      type: 'schema',
      def: {
        [schemaMetaFieldKey]: expect.anything(),
        name: {
          list: false,
          optional: false,
          type: 'string',
        },
        sub: {
          list: false,
          optional: false,
          type: 'schema',

          def: {
            [schemaMetaFieldKey]: expect.anything(),
            name: {
              list: false,
              optional: false,
              type: 'string',
            },
            age: {
              list: false,
              optional: true,
              type: 'int',
            },
            favorites: {
              list: true,
              optional: false,
              type: 'string',
            },
            sex: {
              def: ['m', 'f', 'o'],
              list: false,
              optional: false,
              type: 'enum',
            },
          },
        },
      },
    });
  });

  test('stringFieldDefinition', () => {
    const sut = parseSchemaField(
      'stringFieldDefinition',
      typeDefs.stringFieldDefinition
    );

    expect(sut).toEqual({
      type: 'cursor',
      optional: true,
      list: true,
    });
  });

  test('FieldType as def', () => {
    const sut = parseSchemaField('FieldType', typeDefs.fieldDefAsType);

    expect(sut).toEqual({
      list: true,
      optional: true,
      type: 'string',
      def: {
        max: 2,
        min: 1,
      },
    });
  });

  test('stringDefTypes', () => {
    const sut = parseSchemaField(
      'stringDefTypes',
      createSchema(stringDefTypes)
    );

    expect(sut).toEqual({
      type: 'schema',
      list: false,
      optional: false,
      def: {
        [schemaMetaFieldKey]: expect.anything(),
        stringDefBoolean: {
          list: false,
          optional: false,
          type: 'boolean',
        },
        stringDefBooleanList: {
          list: true,
          optional: false,
          type: 'boolean',
        },
        stringDefBooleanListOptional: {
          list: true,
          optional: true,
          type: 'boolean',
        },
        stringDefCursor: {
          list: false,
          optional: false,
          type: 'cursor',
        },
        stringDefCursorList: {
          list: true,
          optional: false,
          type: 'cursor',
        },
        stringDefCursorListOptional: {
          list: true,
          optional: true,
          type: 'cursor',
        },
        stringDefDate: {
          list: false,
          optional: false,
          type: 'date',
        },
        stringDefDateList: {
          list: true,
          optional: false,
          type: 'date',
        },
        stringDefDateListOptional: {
          list: true,
          optional: true,
          type: 'date',
        },
        stringDefEmail: {
          list: false,
          optional: false,
          type: 'email',
        },
        stringDefEmailList: {
          list: true,
          optional: false,
          type: 'email',
        },
        stringDefEmailListOptional: {
          list: true,
          optional: true,
          type: 'email',
        },
        stringDefFloat: {
          list: false,
          optional: false,
          type: 'float',
        },
        stringDefFloatList: {
          list: true,
          optional: false,
          type: 'float',
        },
        stringDefFloatListOptional: {
          list: true,
          optional: true,
          type: 'float',
        },
        stringDefInt: {
          list: false,
          optional: false,
          type: 'int',
        },
        stringDefIntList: {
          list: true,
          optional: false,
          type: 'int',
        },
        stringDefIntListOptional: {
          list: true,
          optional: true,
          type: 'int',
        },
        stringDefString: {
          list: false,
          optional: false,
          type: 'string',
        },
        stringDefStringList: {
          list: true,
          optional: false,
          type: 'string',
        },
        stringDefStringListOptional: {
          list: true,
          optional: true,
          type: 'string',
        },
        stringDefUlid: {
          list: false,
          optional: false,
          type: 'ulid',
        },
        stringDefUlidList: {
          list: true,
          optional: false,
          type: 'ulid',
        },
        stringDefUlidListOptional: {
          list: true,
          optional: true,
          type: 'ulid',
        },
        stringDefUnknown: {
          list: false,
          optional: false,
          type: 'unknown',
        },
        stringDefUnknownList: {
          list: true,
          optional: false,
          type: 'unknown',
        },
        stringDefUnknownListOptional: {
          list: true,
          optional: true,
          type: 'unknown',
        },
      },
    });
  });
});
