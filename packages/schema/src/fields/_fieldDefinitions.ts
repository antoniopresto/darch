import { SchemaFieldInput } from './_parseFields';
import { RecordFieldDef } from './RecordField';
import { SchemaLike } from './ISchemaLike';

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
    | Readonly<{ [K: string]: SchemaFieldInput }>
    | SchemaLike;

  union: SchemaFieldInput[] | Readonly<SchemaFieldInput[]>;

  enum: Array<string> | Readonly<Array<string>>;
};

export type FieldTypeName = Extract<keyof FieldDefinitions, string>;
