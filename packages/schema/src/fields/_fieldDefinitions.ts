import { InferField } from './_parseFields';
import { NullableToPartial } from '@darch/utils/dist/typeUtils';
import { RecordFieldDef } from './RecordField';

export interface CommonFieldConfig {
  list?: boolean;
  optional?: boolean;
  description?: string;
}

export type TCursor = {
  pk: string;
  prefix: string;
  delimiter: string;
  limit?: number;
  after?: string;
  fields?: string[];
};

export type FieldTypesRecord<Def = undefined> = {
  any: [undefined, any];

  boolean: [undefined, boolean];

  cursor: [undefined, TCursor];

  date: [
    (
      | {
          min?: Date;
          max?: Date;
        }
      | undefined
    ),
    Date
  ];

  email: [
    (
      | {
          regex?: [string] | [string, string];
        }
      | undefined
    ),
    string
  ];

  float: [
    (
      | {
          min?: number;
          max?: number;
        }
      | undefined
    ),
    number
  ];

  int: [
    (
      | {
          min?: number;
          max?: number;
        }
      | undefined
    ),
    number
  ];

  null: [undefined, null];

  record: [
    RecordFieldDef | undefined,

    [Def] extends [undefined]
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
  ];

  string: [
    (
      | {
          min?: number;
          max?: number;
          regex?: [string] | [string, string];
        }
      | undefined
    ),
    string
  ];

  ulid: [
    (
      | {
          autoCreate?: boolean;
        }
      | undefined
    ),
    string
  ];

  undefined: [undefined, undefined];

  unknown: [undefined, unknown];

  schema: [
    Def,

    [Def] extends [undefined]
      ? never
      : [Def] extends [{ [K: string]: any }]
      ? NullableToPartial<{
          [K in keyof Def]: InferField<Def[K]>;
        }>
      : never
  ];

  union: [
    { type: FieldTypeName; __infer: any }[],

    [Def] extends [undefined]
      ? never
      : Def extends { type: FieldTypeName; __infer: any }[]
      ? Def[number]['__infer']
      : never
  ];

  enum: [
    Array<string> | Readonly<Array<string>>,
    //
    [Def] extends [undefined]
      ? never
      : Def extends Array<string> | Readonly<Array<string>>
      ? Def[number]
      : never
  ];
};

export type FieldTypeName = Extract<keyof FieldTypesRecord, string>;
