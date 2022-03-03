import { assert, IsExact } from 'conditional-type-checks';

import { createSchema, Schema } from '../Schema';
import { ParsedFieldDefinition, Infer } from '../TSchemaParser';
import { EnumField } from '../fields/EnumField';
import { parseSchemaDefinition } from '../parseSchemaDefinition';
import { ParseStringDefinition } from '../parseStringDefinition';

describe('typings', () => {
  test('enum', () => {
    type enumT = ParseStringDefinition<'enum?'>;

    assert<
      IsExact<
        enumT,
        {
          type: 'enum';
          optional: true;
          list: false;
          def: undefined;
          description?: string;
        }
      >
    >(true);
  });

  test('TypeFromSchemaDefinition', () => {
    const otherSchema = new Schema({
      name: 'string',
      status: ['open', 'closed'],
    } as const);

    const definition = {
      name: 'string',
      nameList: '[string]',
      nameListOptional: '[string]?',
      optional: 'string?',
      age: 'int',
      gender: { enum: ['male', 'female', 'other'] },
      category: { enum: ['general', 'closed'] },
      categoryRO: { enum: ['general', 'closed'] } as const,
      '12Enum': { enum: ['1', '2'] },
      // enumTypeField: EnumField.create(['x', 'xx']),
      otherSchema,
      otherSchemaList: {
        type: otherSchema,
        list: true,
      },
    } as const;

    type T = Infer<typeof definition>;

    type Expected = {
      name: string;
      nameList: string[];
      nameListOptional?: string[] | undefined;
      optional?: string | undefined;
      age: number;
      gender?: 'male' | 'female' | 'other' | undefined;
      category: 'general' | 'closed';
      categoryRO: 'general' | 'closed';
      '12Enum': '1' | '2';
      enumTypeField: 'x' | 'xx';
      otherSchema: {
        name: string;
        status: 'open' | 'closed';
      };
      otherSchemaList: {
        name: string;
        status: 'open' | 'closed';
      }[];
    };

    assert<IsExact<T, Expected>>(true);
  });

  it('parseSchemaDefinition', () => {
    const sut = parseSchemaDefinition({
      string: 'string',
      stringOptional: 'string?',
      arrayString: '[string]',
      arrayStringOptional: '[string]?',
      objectIntDef: {
        type: 'int',
      },
      enum: ['a', 'b'],
      fieldType: EnumField.create(['a', 'x']),
      fieldTypeOptional: EnumField.create(['a', 'x']).optional(),
      fieldTypeOptionalList: EnumField.create(['a', 'x']).list().optional(),
    } as const);

    type Def = typeof sut;

    assert<
      IsExact<
        Def,
        {
          string: {
            list: false;
            optional: false;
            type: 'string';
            def: undefined;
            description?: string;
          };

          stringOptional: {
            list: false;
            optional: true;
            type: 'string';
            def: undefined;
            description?: string;
          };
          arrayString: {
            list: true;
            optional: false;
            type: 'string';
            def: undefined;
            description?: string;
          };
          arrayStringOptional: {
            list: true;
            optional: true;
            type: 'string';
            def: undefined;
            description?: string;
          };
          objectIntDef: {
            list: false;
            optional: false;
            type: 'int';
            def: undefined;
            description?: string;
          };
          enum: {
            def: readonly ['a', 'b'];
            list: false;
            optional: false;
            type: 'enum';
            description?: string;
          };
          fieldType: {
            def: ['a', 'x'];
            list: false;
            optional: false;
            type: 'enum';
            description?: string;
          };
          fieldTypeOptional: {
            def: ['a', 'x'];
            list: false;
            optional: true;
            type: 'enum';
            description?: string;
          };
          fieldTypeOptionalList: {
            def: ['a', 'x'];
            list: true;
            optional: true;
            type: 'enum';
            description?: string;
          };
        }
      >
    >(true);
  });

  test('schema as type', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
    });

    type S1 = {
      name: string;
      age?: number | undefined;
    };

    type TS1 = Infer<typeof schema1>;
    assert<IsExact<TS1, S1>>(true);

    const schema2 = createSchema({
      people: schema1,
      status: ['open', 'closed'],
      names: '[string]?',
    } as const);

    type S2 = {
      people: S1;
      status: 'open' | 'closed';
      names?: string[] | undefined;
    };

    type TS2 = Infer<typeof schema2>;

    assert<IsExact<TS2, S2>>(true);

    const schema3 = createSchema({
      classes: schema2,
      classesListOptional: {
        type: schema2,
        list: true,
        optional: true,
      },
      count: 'int',
    } as const);

    type S3 = {
      classes: S2;
      classesListOptional?: S2[] | undefined;
      count: number;
    };

    type T3 = Infer<typeof schema3>;

    assert<IsExact<T3, S3>>(true);
  });

  test('literal schema object', () => {
    const schema1 = createSchema({
      a: 'string?',
      b: {
        schema: {
          name: 'string?',
          age: 'int',
          numbers: '[float]?',
        },
        optional: true,
        list: true,
      },
    } as const);

    type P = ParsedFieldDefinition<typeof schema1>;

    type Result = Infer<P>;

    type Expected = {
      a?: string | undefined;
      b?:
        | {
            name?: string;
            age: number;
            numbers?: number[];
          }[]
        | undefined;
    };

    assert<IsExact<Result, Expected>>(true);
  });

  // it('union with optional item', () => {
  //   // const soi = UnionField.create([{ type: 'string', optional: true }, 'int'] as const);
  //   const soi_ = [[{ type: 'string', optional: true }, 'int?']] as const;
  //   // type soipp = ParsedFieldDefinition<typeof soi>
  //   type soipp_ = ParsedFieldDefinition<typeof soi_>
  //
  //
  //
  //   const si = UnionField.create([{ type: 'string', optional: false }, 'int'] as const);
  //   const si_ = [[{ type: 'string', optional: false }, 'int']] as const;
  //
  //   const si2 = UnionField.create([StringField.create(), 'int'] as const);
  //   const si2_ = [[StringField.create(), 'int']] as const;
  //
  //   const soli = UnionField.create([StringField.create().list().optional(), 'int'] as const);
  //   const soli_ = [[StringField.create().list().optional(), 'int']] as const;
  //
  //   const sli = UnionField.create([StringField.create().list(), 'int'] as const);
  //   const sli_ = [[StringField.create().list(), 'int']] as const;
  //
  //   // const siol = UnionField.create(['[int]?', UnionField.create(['string'])]);
  //
  //   const colid = UnionField.create(['[cursor]?', 'ulid'] as const);
  //   const colid_ = [['[cursor]?', 'ulid']] as const;
  //
  //   const unk = UnionField.create(['unknown?', 'int'] as const);
  //   const unk_ = [['unknown?', 'int']] as const;
  //
  //   type T1 = {
  //     soi?: string | undefined | number;
  //     si: string | number;
  //     si2: string | number;
  //     soli?: string[] | undefined | number;
  //     sli: string[] | number;
  //     // siol?: string | number[] | undefined;
  //     colid?: CursorType[] | undefined | string;
  //     unk?: unknown;
  //
  //     soi_?: string | undefined | number;
  //     si_: string | number;
  //     si2_: string | number;
  //     soli_?: string[] | undefined | number;
  //     sli_: string[] | number;
  //     // siol_?: string | number[] | undefined;
  //     colid_?: CursorType[] | undefined | string;
  //     unk_?: unknown;
  //   };
  //
  //   const definition = {
  //     soi,
  //     // si,
  //     // si2,
  //     // soli,
  //     // sli,
  //     // // siol,
  //     // colid,
  //     // unk,
  //
  //     soi_,
  //     // si_,
  //     // si2_,
  //     // soli_,
  //     // sli_,
  //     // // siol_,
  //     // colid_,
  //     // unk_,
  //   } as const
  //
  //   const schema1 = createSchema(definition);
  //
  //   type S1 = TypeFromSchema<typeof schema1>;
  //
  //   assert<IsExact<T1, S1>>(true);
  // });
});
