import { SchemaFieldInput } from './_parseFields';
import { RecordFieldDef } from './RecordField';

export type TCursor = {
  pk: string;
  prefix: string;
  delimiter: string;
  limit?: number;
  after?: string;
  fields?: string[];
};

export type FieldDefinitions = {
  any: undefined;

  boolean: undefined;

  cursor: undefined;

  date:
    | {
        min?: Date;
        max?: Date;
      }
    | undefined;

  email:
    | {
        regex?: [string] | [string, string];
      }
    | undefined;

  float:
    | {
        min?: number;
        max?: number;
      }
    | undefined;

  int:
    | {
        min?: number;
        max?: number;
      }
    | undefined;

  null: undefined;

  record: RecordFieldDef | undefined;

  string:
    | {
        min?: number;
        max?: number;
        regex?: [string] | [string, string];
      }
    | undefined;

  ulid:
    | {
        autoCreate?: boolean;
      }
    | undefined;

  undefined: undefined;

  unknown: undefined;

  schema:
    | { [K: string]: SchemaFieldInput }
    | Readonly<{ [K: string]: SchemaFieldInput }>;

  union: SchemaFieldInput[] | Readonly<SchemaFieldInput[]>;

  enum: Array<string> | Readonly<Array<string>>;
};

export type InferFieldType<Type, Def = undefined> =
  //
  Type extends 'any'
    ? any
    : Type extends 'boolean'
    ? boolean
    : Type extends 'cursor'
    ? TCursor
    : Type extends 'null'
    ? null
    : Type extends 'undefined'
    ? undefined
    : Type extends 'unknown'
    ? unknown
    : Type extends 'string'
    ? string
    : Type extends 'date'
    ? Date
    : Type extends 'email'
    ? string
    : Type extends 'float'
    ? number
    : Type extends 'int'
    ? number
    : Type extends 'ulid'
    ? string
    : //

    // === parsing record type ===
    Type extends 'record'
    ? [Def] extends [undefined]
      ? { [K: string]: any }
      : Def extends { keyType: 'int' | 'float' }
      ? {
          [K: number]: Def extends { type: { __infer: infer Infer } }
            ? Infer
            : any;
        }
      : {
          [K: string]: Def extends { type: { __infer: infer Infer } }
            ? Infer
            : any;
        }
    : //

    // == parsing enum
    Type extends 'enum'
    ? Def extends Array<infer Val> | Readonly<Array<infer Val>>
      ? Val
      : never
    : never;

export type FieldTypeName = Extract<keyof FieldDefinitions, string>;
