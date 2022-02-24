export interface CommonFieldConfig {
  list?: boolean;
  optional?: boolean;
  description?: string;
}

export type FieldTypesRecord<Def = undefined> = {
  any: [undefined, any];

  boolean: [undefined, boolean];

  cursor: [
    undefined,
    {
      pk: string;
      prefix: string;
      delimiter: string;
      limit?: number;
      after?: string;
      fields?: string[];
    }
  ];

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
    {
      keyType: 'string';
      type: { __infer: any };
    },

    Def extends { keyType: 'int' | 'float' }
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

  schema: [Def, any /*FIXME*/];

  union: [
    { type: FieldTypeNames; __infer: any }[],

    Def extends { type: FieldTypeNames; __infer: any }[]
      ? Def[number]['__infer']
      : never
  ];

  enum: [
    Array<string> | Readonly<Array<string>>,
    //
    Def extends Array<string> | Readonly<Array<string>> ? Def[number] : never
  ];
};

export type FieldTypeNames = Extract<keyof FieldTypesRecord, string>;
