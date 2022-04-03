import { assert, IsExact } from 'conditional-type-checks';

import { createSchema } from '../Schema';
import { EnumField } from '../fields/EnumField';
import { parseSchemaField, parseSingleKeyObjectDefinition } from '../parseSchemaDefinition';

import { schemaMocks } from './__mock__';
import {Infer} from "../Infer";

const { typeDefs, stringDefTypes, schema2 } = schemaMocks;

describe('parseSchemaField', () => {
  test('isSingleKeyObjectDefinition', () => {
    expect(parseSingleKeyObjectDefinition(EnumField.create(['a', 'b']))).toEqual(false);
    expect(parseSingleKeyObjectDefinition('string')).toEqual(false);
    expect(parseSingleKeyObjectDefinition({ type: 'string' })).toEqual(false);
    expect(
      parseSingleKeyObjectDefinition({
        gender: {
          type: 'enum',
          def: ['male', 'female', 'other'],
          optional: true,
        },
      })
    ).toEqual(false);

    expect(
      parseSingleKeyObjectDefinition({
        schema: {
          name: 'string',
        },
      })
    ).toEqual({
      def: { name: 'string' },
      description: '',
      list: false,
      optional: false,
      type: 'schema',
    });

    expect(
      parseSingleKeyObjectDefinition({
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
      description: '',
      list: true,
      optional: true,
      type: 'string',
    });

    expect(
      parseSingleKeyObjectDefinition({
        string: {
          min: 1,
        },
        description: true, // <-- invalid
      })
    ).toEqual(false);

    const spyWarn = jest.spyOn(console, 'warn');
    expect(spyWarn).toBeCalledTimes(0);
    expect(
      parseSingleKeyObjectDefinition({
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
    const sut = parseSchemaField('enumStringArray', ['a', 'b', 'c'] as const);

    expect(sut).toEqual({
      type: 'enum',
      optional: false,
      list: false,
      def: ['a', 'b', 'c'],
    });

    type FinalType = Infer<{ sut: typeof sut }>;
    assert<IsExact<FinalType, { sut: 'a' | 'b' | 'c' }>>(true);
  });

  test('enum FieldType', () => {
    const single = parseSchemaField('enum FieldType', EnumField.create(['a', 'b']));
    const list = parseSchemaField('enum FieldType', EnumField.create(['a', 'b']).toList());
    const listOptional = parseSchemaField('enum FieldType', EnumField.create(['a', 'b']).toList().toOptional());

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

    type EnumFinalType = Infer<{ sut: typeof single }>;
    type EnumListFinalType = Infer<{ sut: typeof list }>;
    type EnumListOptionalFinalType = Infer<{ sut: typeof listOptional }>;

    assert<IsExact<EnumFinalType, { sut: 'a' | 'b' }>>(true);
    assert<IsExact<EnumListFinalType, { sut: ('a' | 'b')[] }>>(true);
    assert<IsExact<EnumListOptionalFinalType, { sut?: ('a' | 'b')[] | undefined }>>(true);
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
    const sut = parseSchemaField('schemaObjectAsType', typeDefs.schemaObjectAsType);

    expect(sut).toEqual({
      list: true,
      optional: true,
      type: 'schema',
      def: {
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
    const sut = parseSchemaField('stringFieldDefinition', typeDefs.stringFieldDefinition);

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
    const sut = parseSchemaField('stringDefTypes', createSchema(stringDefTypes));

    expect(sut).toEqual({
      type: 'schema',
      list: false,
      optional: false,
      def: {
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
