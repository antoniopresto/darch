type Writeable<T> = {
  -readonly [P in keyof T]: T[P];
};
type WR<T> = T | Readonly<T>;

export interface CommonSchemaFieldConfig {
  list?: boolean;
  optional?: boolean;
  description?: string;
}

export interface FieldTypeConfig<
  ConfigConfig extends {
    type: string;
    def:
      | undefined
      | Record<string, unknown>
      | any[]
      | Readonly<Record<string, unknown> | any[]>;
    __infer: unknown;
  }
> extends CommonSchemaFieldConfig {
  type: ConfigConfig['type'];
  def: Writeable<ConfigConfig['def']>;
  __infer: ConfigConfig['__infer'];
}

export type FieldConfigAny = FieldTypeConfig<{
  type: 'any';
  def: undefined;
  __infer: any;
}>;

export type FieldConfigBoolean = FieldTypeConfig<{
  type: 'boolean';
  def: undefined;
  __infer: boolean;
}>;

export type FieldConfigCursor = FieldTypeConfig<{
  type: 'cursor';
  def: undefined;
  __infer: {
    pk: string;
    prefix: string;
    delimiter: string;
    limit?: number;
    after?: string;
    fields?: string[];
  };
}>;

export type FieldConfigDate = FieldTypeConfig<{
  type: 'date';
  def:
    | {
        min?: Date;
        max?: Date;
      }
    | undefined;
  __infer: Date;
}>;

export type FieldConfigEmail = FieldTypeConfig<{
  type: 'email';
  def:
    | {
        regex?: [string] | [string, string];
      }
    | undefined;
  __infer: string;
}>;

export type FieldConfigEnum<
  T extends WR<string>,
  Def extends WR<[T, ...T[]]>
> = FieldTypeConfig<{
  type: 'enum';
  def: Def;
  __infer: T[number];
}>;

export type FieldConfigFloat = FieldTypeConfig<{
  type: 'float';
  def:
    | {
        min?: number;
        max?: number;
      }
    | undefined;
  __infer: number;
}>;

export type FieldConfigInt = FieldTypeConfig<{
  type: 'int';
  def: {
    min?: number;
    max?: number;
  };
  __infer: number;
}>;

export type FieldConfigNull = FieldTypeConfig<{
  type: 'null';
  def: undefined;
  __infer: null;
}>;

export type FieldConfigRecord<
  Def extends {
    keyType?: 'int' | 'string' | 'float';
    type: FieldTypeConfig<any>;
  } = { keyType: 'string'; type: FieldConfigAny }
> = FieldTypeConfig<{
  type: 'record';
  def: Def;
  __infer: Def extends { keyType: 'int' | 'float' }
    ? {
        [K: number]: Def['type']['__infer'];
      }
    : {
        [K: string]: Def['type']['__infer'];
      };
}>;

export type FieldConfigString = FieldTypeConfig<{
  type: 'string';
  def:
    | {
        min?: number;
        max?: number;
        regex?: [string] | [string, string];
      }
    | undefined;
  __infer: string;
}>;

export type FieldConfigSchema<Def extends Record<string, any>> =
  FieldTypeConfig<{
    type: 'schema';
    def: Def; // FIXME
    __infer: any; // FIXME
  }>;

export type FieldConfigUlid = FieldTypeConfig<{
  type: 'ulid';
  def:
    | {
        autoCreate?: boolean;
      }
    | undefined;
  __infer: string;
}>;

export type FieldConfigUndefined = FieldTypeConfig<{
  type: 'undefined';
  def: undefined;
  __infer: undefined;
}>;

export type FieldConfigUnion<
  Def extends WR<{ type: FieldTypeNames; __infer: any }[]>
> = FieldTypeConfig<{
  type: 'union';
  def: Def;
  __infer: Def[number]['__infer'];
}>;

export type FieldConfigUnknown = FieldTypeConfig<{
  type: 'unknown';
  def: undefined;
  __infer: unknown;
}>;

export type FieldTypes = {
  any: FieldConfigAny;
  boolean: FieldConfigBoolean;
  cursor: FieldConfigCursor;
  date: FieldConfigDate;
  email: FieldConfigEmail;
  float: FieldConfigFloat;
  int: FieldConfigInt;
  null: FieldConfigNull;
  record: FieldConfigRecord;
  string: FieldConfigString;
  ulid: FieldConfigUlid;
  undefined: FieldConfigUndefined;
  unknown: FieldConfigUnknown;

  // types with required definition
  schema: FieldConfigSchema<any>;
  union: FieldConfigUnion<any>;
  enum: FieldConfigEnum<any, any>;
};

export type FieldTypeNames = Extract<keyof FieldTypes, string>;
