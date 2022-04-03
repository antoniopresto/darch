import { RuntimeError } from '@darch/utils/dist/RuntimeError';
import { assert, IsExact } from 'conditional-type-checks';

import { BooleanField } from '../fields/BooleanField';
import { CursorField, CursorType } from '../fields/CursorField';
import { DateField } from '../fields/DateField';
import { EmailField } from '../fields/EmailField';
import { EnumField } from '../fields/EnumField';
import { FloatField } from '../fields/FloatField';
import { IntField } from '../fields/IntField';
import { RecordField } from '../fields/RecordField';
import { StringField } from '../fields/StringField';
import { ULID_REGEX, UlidField } from '../fields/UlidField';
import { UnknownField } from '../fields/UnknownField';
import { createSchema } from '../index';
import { fieldToGraphql, schemaToGQL } from '../schemaToGQL';
import { schemaToTypescript } from '../schemaToTypescript';
import {Infer} from "../Infer";

describe('FieldTypes', () => {
  describe('field to graphql', () => {
    test('scalar gql', () => {
      const type = (t: any) =>
        fieldToGraphql({
          field: { list: false, optional: false, def: undefined, ...t },
          parentName: 'foo',
          fieldName: 'field',
        })
          .type.getType()
          .toString();

      expect(type({ type: 'string' })).toEqual('String!');
      expect(type({ type: 'string', list: true })).toEqual('[String]!');
      expect(type({ type: 'string', list: true, optional: true })).toEqual(
        '[String]'
      );
      expect(type({ type: 'string', list: false, optional: true })).toEqual(
        'String'
      );
      expect(type({ type: 'cursor', list: true, optional: true })).toEqual(
        '[Cursor]'
      );
      expect(type({ type: 'cursor', list: true })).toEqual('[Cursor]!');
    });
  });

  describe('StringField', () => {
    it('parses', () => {
      expect(() => StringField.create({ min: 1 }).parse('')).toThrow(
        '0 is less than the min length 1.'
      );
      expect(() => StringField.create({ max: 2 }).parse('123')).toThrow(
        '3 is more than the max length 2.'
      );
      expect(StringField.create({ regex: ['^MIN.$', 'i'] }).parse('mine')).toBe(
        'mine'
      );
      expect(() =>
        StringField.create({ regex: ['MIN.'] }).parse('mine')
      ).toThrowError('Invalid');
    });

    it('accept custom parse message', () => {
      expect(() =>
        StringField.create({ min: 5 }).parse('abc', 'custom')
      ).toThrowError(new RuntimeError('custom', { input: 'abc' }));

      expect(() =>
        StringField.create({ min: 5 }).parse(
          'abc',
          (v) => `hmm ${v} is not enough`
        )
      ).toThrowError(
        new RuntimeError('hmm abc is not enough', { input: 'abc' })
      );

      expect(() =>
        StringField.create({ min: 5 }).parse('xpt', () => new TypeError('tt'))
      ).toThrowError(TypeError('tt'));
    });

    test('types', () => {
      const def = {
        name: 'string',
        nameOpt: 'string?',
        nameList: '[string]',
        nameListOptional: '[string]?',
      } as const;

      const gql = schemaToGQL('TempString', def);

      expect(gql.toSDL()).toEqual(
        'type TempString {\n' +
          '  name: String!\n' +
          '  nameOpt: String\n' +
          '  nameList: [String]!\n' +
          '  nameListOptional: [String]\n' +
          '  nameFromType: [String]\n' +
          '  defObject: [String]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: string;
            nameOpt?: string | undefined;
            nameList: string[];
            nameListOptional?: string[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('UlidField', () => {
    it('parses', () => {
      expect(UlidField.create({ autoCreate: true }).parse(undefined)).toMatch(
        ULID_REGEX
      );
      expect(() =>
        UlidField.create({ autoCreate: false }).parse(undefined)
      ).toThrow('Required');

      const VALID = '01FH3RMAQ4QWJ0ZJB73G4BPEEK';
      expect(UlidField.create().parse(VALID)).toEqual(VALID);
      expect(() => UlidField.create().parse('xxx')).toThrow('Invalid ulid.');
      expect(() =>
        UlidField.create().parse('xpt', () => new TypeError('ulid'))
      ).toThrowError(TypeError('ulid'));
    });

    test('types', () => {
      const def = {
        name: 'ulid',
        nameOpt: 'ulid?',
        nameList: '[ulid]',
        nameListOptional: '[ulid]?',
        nameFromType: UlidField.create().toList().toOptional(),
        defObject: {
          type: 'ulid',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempUlid', def);

      expect(gql.toSDL()).toEqual(
        'type TempUlid {\n' +
          '  name: Ulid!\n' +
          '  nameOpt: Ulid\n' +
          '  nameList: [Ulid]!\n' +
          '  nameListOptional: [Ulid]\n' +
          '  nameFromType: [Ulid]\n' +
          '  defObject: [Ulid]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: string;
            nameOpt?: string | undefined;
            nameList: string[];
            nameListOptional?: string[] | undefined;
            nameFromType?: string[] | undefined;
            defObject?: string[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('IntField', () => {
    it('parses', () => {
      expect(() => IntField.create().parse(undefined)).toThrow('Required');
      expect(() => IntField.create({ min: 1000 }).parse(5)).toThrow(
        '5 is less than the minimum 1000.'
      );
      expect(() => IntField.create({ max: 1 }).parse(2)).toThrow(
        '2 is more than the maximum 1.'
      );
      expect(() => IntField.create().parse(0.1)).toThrow(
        '0.1 is not a valid integer.'
      );

      expect(IntField.create().parse('1000044')).toBe(1000044);
      expect(() => IntField.create().parse('abc')).toThrow(
        'Expected value to be of type "number", found string instead.'
      );
    });

    test('types', () => {
      const def = {
        name: 'int',
        nameOpt: 'int?',
        nameList: '[int]',
        nameListOptional: '[int]?',
        nameFromType: IntField.create().toList().toOptional(),
        defObject: {
          type: 'int',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempInt', def);

      expect(gql.toSDL()).toEqual(
        'type TempInt {\n' +
          '  name: Int!\n' +
          '  nameOpt: Int\n' +
          '  nameList: [Int]!\n' +
          '  nameListOptional: [Int]\n' +
          '  nameFromType: [Int]\n' +
          '  defObject: [Int]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: number;
            nameOpt?: number | undefined;
            nameList: number[];
            nameListOptional?: number[] | undefined;
            nameFromType?: number[] | undefined;
            defObject?: number[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('FloatField', () => {
    it('parses', () => {
      expect(() => FloatField.create().parse(undefined)).toThrow('Required');
      expect(() => FloatField.create({ min: 1000 }).parse(5)).toThrow(
        '5 is less than the minimum 1000.'
      );
      expect(() => FloatField.create({ max: 1 }).parse(2)).toThrow(
        '2 is more than the maximum 1.'
      );
      expect(FloatField.create().parse(0.1)).toBe(0.1);
      expect(FloatField.create().parse('1.5')).toBe(1.5);
      expect(() => FloatField.create().parse('abc')).toThrow(
        'Expected value to be of type "number", found string instead.'
      );
    });

    test('types', () => {
      const def = {
        name: 'float',
        nameOpt: 'float?',
        nameList: '[float]',
        nameListOptional: '[float]?',
        nameFromType: FloatField.create().toList().toOptional(),
        defObject: {
          type: 'float',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempFloatField', def);

      expect(gql.toSDL()).toEqual(
        'type TempFloatField {\n' +
          '  name: Float!\n' +
          '  nameOpt: Float\n' +
          '  nameList: [Float]!\n' +
          '  nameListOptional: [Float]\n' +
          '  nameFromType: [Float]\n' +
          '  defObject: [Float]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: number;
            nameOpt?: number | undefined;
            nameList: number[];
            nameListOptional?: number[] | undefined;
            nameFromType?: number[] | undefined;
            defObject?: number[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('EnumField', () => {
    it('parses', () => {
      expect(() => EnumField.create(['a', 'b']).parse(undefined)).toThrow(
        'Required field'
      );
      expect(() => EnumField.create(['a', 'b']).parse(null)).toThrow(
        "accepted: 'a' or 'b', found null."
      );

      expect(() =>
        EnumField.create(['xx']).parse('ZZ', (v) => `${v}?`)
      ).toThrowError(new RuntimeError('ZZ?', { input: 'ZZ' }));
    });

    test('types', () => {
      const def = {
        name: ['a', 'x'],
        nameFromType: EnumField.create(['a', 'x']).toList().toOptional(),
        defObject: {
          type: 'enum',
          optional: true,
          list: true,
          def: ['a', 'x'],
        },
      } as const;

      const gql = schemaToGQL('TempEnumField', def);

      expect(gql.toSDL()).toEqual(
        'type TempEnumField {\n' +
          '  name: TempEnumFieldNameEnum!\n' +
          '  nameFromType: [TempEnumFieldNameFromTypeEnum]\n' +
          '  defObject: [TempEnumFieldDefObjectEnum]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: 'a' | 'x';
            nameFromType?: ('a' | 'x')[] | undefined;
            defObject?: ('a' | 'x')[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('EmailField', () => {
    it('parses', () => {
      expect(() => EmailField.create().parse(undefined)).toThrow('Required');
      expect(() => EmailField.create().parse(null)).toThrow(
        'Expected value to be of type "string", found null instead.'
      );
      expect(() => EmailField.create().parse('xx')).toThrow('Invalid email');
      expect(() => EmailField.create().parse('xx', () => 'huu')).toThrow('huu');
      expect(EmailField.create().parse('xx@zz.com')).toEqual('xx@zz.com');
    });

    test('types', () => {
      const def = {
        name: 'email',
        nameOpt: 'email?',
        nameList: '[email]',
        nameListOptional: '[email]?',
        nameFromType: EmailField.create().toList().toOptional(),
        defObject: {
          type: 'email',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempEmail', def);

      expect(gql.toSDL()).toEqual(
        'type TempEmail {\n' +
          '  name: Email!\n' +
          '  nameOpt: Email\n' +
          '  nameList: [Email]!\n' +
          '  nameListOptional: [Email]\n' +
          '  nameFromType: [Email]\n' +
          '  defObject: [Email]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: string;
            nameOpt?: string | undefined;
            nameList: string[];
            nameListOptional?: string[] | undefined;
            nameFromType?: string[] | undefined;
            defObject?: string[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('RecordField', () => {
    it('parses', () => {
      expect(() => RecordField.create().parse(undefined)).toThrow('Required');

      expect(() => RecordField.create().parse(null)).toThrow(
        'Expected value to be of type "object", found null instead.'
      );

      expect(() => RecordField.create().parse([])).toThrow(
        'Expected value to be of type "object", found array instead.'
      );

      expect(() =>
        RecordField.create({ type: 'int' }).parse({ a: 'xx' })
      ).toThrow(
        'field \'a\': Expected value to be of type "number", found string instead.'
      );

      expect(
        RecordField.create({ type: [['int', 'boolean']] }).parse({
          a: '1',
          b: true,
        })
      ).toEqual({
        a: 1,
        b: true,
      });

      expect(() =>
        RecordField.create({ type: 'float', keyType: 'int' }).parse({ a: '1' })
      ).toThrow(
        'Unexpected record key `a`. Expected value to be of type "number", found string instead.'
      );
    });

    test('types', () => {
      const def = {
        name: 'record',
        nameOpt: 'record?',
        nameList: '[record]',
        nameListOptional: '[record]?',
        nameFromType: RecordField.create({ type: '[int]?' }).toList().toOptional(),
        defObject: {
          type: 'record',
          def: {
            keyType: 'int',
            type: 'boolean',
          },
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempRecord', def);

      expect(gql.toSDL()).toEqual(
        'type TempRecord {\n' +
          '  name: Record!\n' +
          '  nameOpt: Record\n' +
          '  nameList: [Record]!\n' +
          '  nameListOptional: [Record]\n' +
          '  nameFromType: [Record]\n' +
          '  defObject: [Record]\n' +
          '}'
      );

      type AnyRecord = Record<string, any>;
      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: AnyRecord;
            nameOpt?: AnyRecord | undefined;
            nameList: AnyRecord[];
            nameListOptional?: AnyRecord[] | undefined;
            nameFromType?: Record<string, number[] | undefined>[] | undefined;
            defObject?: Record<number, boolean>[] | undefined;
          }
        >
      >(true);
    });

    // TODO
    xtest('ts-types', async () => {
      const schema = createSchema({
        r1: {
          record: {
            type: {
              schema: {
                name: 'string',
                age: 'int',
              },
            },
          },
        },
        r2: 'record?',
        r3: '[record]?',
      });

      const sut = await schemaToTypescript('records', schema.definition);

      expect(sut).toEqual('');
    });
  });

  describe('DateField', () => {
    it('parses', () => {
      expect(() => DateField.create().parse(undefined)).toThrow('Required');
      expect(() => DateField.create().parse(null)).toThrow(
        'Expected value to be of type "date", found null instead.'
      );
      expect(() => DateField.create().parse(new Date().toISOString())).toThrow(
        'Expected value to be of type "date", found string instead.'
      );
      expect(() => DateField.create().parse('xx', () => 'huu')).toThrow('huu');

      const now = new Date(1);
      const past = new Date(0);
      const future = new Date(2);

      expect(DateField.create().parse(now)).toEqual(now);

      expect(() => DateField.create({ min: now }).parse(past)).toThrow(
        '1970-01-01T00:00:00.000Z is less than the minimum 1970-01-01T00:00:00.001Z.'
      );

      expect(() => DateField.create({ max: now }).parse(future)).toThrow(
        '1970-01-01T00:00:00.002Z is more than the maximum 1970-01-01T00:00:00.001Z.'
      );

      expect(() =>
        DateField.create({ max: now }).parse(future, () => 'xit')
      ).toThrow('xit');
    });

    test('types', () => {
      const def = {
        name: 'date',
        nameOpt: 'date?',
        nameList: '[date]',
        nameListOptional: '[date]?',
        nameFromType: DateField.create().toList().toOptional(),
        defObject: {
          type: 'date',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempDate', def);

      expect(gql.toSDL()).toEqual(
        'type TempDate {\n' +
          '  name: Date!\n' +
          '  nameOpt: Date\n' +
          '  nameList: [Date]!\n' +
          '  nameListOptional: [Date]\n' +
          '  nameFromType: [Date]\n' +
          '  defObject: [Date]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: Date;
            nameOpt?: Date | undefined;
            nameList: Date[];
            nameListOptional?: Date[] | undefined;
            nameFromType?: Date[] | undefined;
            defObject?: Date[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('CursorField', () => {
    it('parses', () => {
      expect(() => CursorField.create().parse(undefined)).toThrow(
        'Required field'
      );
      expect(() => CursorField.create().parse(null)).toThrow('Invalid input.');
      expect(() => CursorField.create().parse(12)).toThrow(
        'Expected cursor, found 12'
      );
      expect(() => CursorField.create().parse('xx', () => 'huu')).toThrow(
        'huu'
      );

      expect(() =>
        CursorField.create().parse({
          a: 1,
        })
      ).toThrow(`➤ field "pk": expected type string, found undefined.`);

      expect(
        CursorField.create().parse({
          pk: 'a',
          prefix: 'b',
          delimiter: 'c',
          limit: 1,
          after: 'd',
          fields: ['surname'],
        })
      ).toEqual({
        pk: 'a',
        prefix: 'b',
        delimiter: 'c',
        limit: 1,
        after: 'd',
        fields: ['surname'],
      });
    });

    test('types', () => {
      const def = {
        name: 'cursor',
        nameOpt: 'cursor?',
        nameList: '[cursor]',
        nameListOptional: '[cursor]?',
        nameFromType: CursorField.create().toList().toOptional(),
        defObject: {
          type: 'cursor',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempCursorField', def);

      expect(gql.toSDL()).toEqual(
        'type TempCursorField {\n' +
          '  name: Cursor!\n' +
          '  nameOpt: Cursor\n' +
          '  nameList: [Cursor]!\n' +
          '  nameListOptional: [Cursor]\n' +
          '  nameFromType: [Cursor]\n' +
          '  defObject: [Cursor]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: CursorType;
            nameOpt?: CursorType | undefined;
            nameList: CursorType[];
            nameListOptional?: CursorType[] | undefined;
            nameFromType?: CursorType[] | undefined;
            defObject?: CursorType[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('BooleanField', () => {
    it('parses', () => {
      expect(() => BooleanField.create().parse(undefined)).toThrow(
        'Required field'
      );
      expect(() => BooleanField.create().parse(null)).toThrow(
        'Expected boolean, found Null'
      );
      expect(() => BooleanField.create().parse('xx', () => 'huu')).toThrow(
        'huu'
      );
      expect(BooleanField.create().parse(false)).toEqual(false);
      expect(BooleanField.create().parse(true)).toEqual(true);
    });

    test('types', () => {
      const def = {
        name: 'boolean',
        nameOpt: 'boolean?',
        nameList: '[boolean]',
        nameListOptional: '[boolean]?',
        nameFromType: BooleanField.create().toList().toOptional(),
        defObject: {
          type: 'boolean',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempBooleanField', def);

      expect(gql.toSDL()).toEqual(
        'type TempBooleanField {\n' +
          '  name: Boolean!\n' +
          '  nameOpt: Boolean\n' +
          '  nameList: [Boolean]!\n' +
          '  nameListOptional: [Boolean]\n' +
          '  nameFromType: [Boolean]\n' +
          '  defObject: [Boolean]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: boolean;
            nameOpt?: boolean | undefined;
            nameList: boolean[];
            nameListOptional?: boolean[] | undefined;
            nameFromType?: boolean[] | undefined;
            defObject?: boolean[] | undefined;
          }
        >
      >(true);
    });
  });

  describe('UnknownField', () => {
    it('parses', () => {
      expect(() => UnknownField.create().parse(undefined)).toThrow('Required');
      expect(UnknownField.create().parse(null)).toBe(null);

      expect(() =>
        UnknownField.create({ types: ['number'] }).parse([])
      ).toThrow();

      expect(UnknownField.create({ types: ['number'] }).parse(1)).toBe(1);

      expect(() =>
        UnknownField.create({ types: ['number'] }).parse('xx', () => 'huu')
      ).toThrow('huu');

      expect(UnknownField.create().parse(false)).toEqual(false);
      expect(UnknownField.create().parse(true)).toEqual(true);
    });

    test('types', () => {
      const def = {
        name: 'unknown',
        nameOpt: 'unknown?',
        nameList: '[unknown]',
        nameListOptional: '[unknown]?',
        nameFromType: UnknownField.create().toList().toOptional(),
        defObject: {
          type: 'unknown',
          optional: true,
          list: true,
        },
      } as const;

      const gql = schemaToGQL('TempUnknownField', def);

      expect(gql.toSDL()).toEqual(
        'type TempUnknownField {\n' +
          '  name: Unknown!\n' +
          '  nameOpt: Unknown\n' +
          '  nameList: [Unknown]!\n' +
          '  nameListOptional: [Unknown]\n' +
          '  nameFromType: [Unknown]\n' +
          '  defObject: [Unknown]\n' +
          '}'
      );

      type T = Infer<typeof def>;

      assert<
        IsExact<
          T,
          {
            name: unknown;
            nameOpt?: unknown | undefined;
            nameList: unknown[];
            nameListOptional?: unknown[] | undefined;
            nameFromType?: unknown[] | undefined;
            defObject?: unknown[] | undefined;
          }
        >
      >(true);
    });
  });
});
