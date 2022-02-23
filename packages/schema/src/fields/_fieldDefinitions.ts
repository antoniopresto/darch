type WR<T> = T | Readonly<T>;

export interface CommonFieldConfig {
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
> extends CommonFieldConfig {
  type: ConfigConfig['type'];
  def: ConfigConfig['def'];
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

type _EnumFieldDef = WR<string[]>;
export type FieldConfigEnum<Def extends _EnumFieldDef> = FieldTypeConfig<{
  type: 'enum';
  def: WR<Def>;
  __infer: Def[number];
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

type _SchemaFieldDef = Record<string, any>;
export type FieldConfigSchema<Def extends _SchemaFieldDef> = FieldTypeConfig<{
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

type _UnionFieldDef = { type: FieldTypeNames; __infer: any }[];
export type FieldConfigUnion<Def extends _UnionFieldDef> = FieldTypeConfig<{
  type: 'union';
  def: Def;
  __infer: Def[number]['__infer'];
}>;

export type FieldConfigUnknown = FieldTypeConfig<{
  type: 'unknown';
  def: undefined;
  __infer: unknown;
}>;

export type FieldTypesRecord<T = undefined> = {
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
  schema: T extends _SchemaFieldDef ? FieldConfigSchema<T> : never;
  union: T extends _UnionFieldDef ? FieldConfigUnion<T> : never;
  enum: T extends _EnumFieldDef ? FieldConfigEnum<T> : never;
};

export type FieldTypeNames = Extract<keyof FieldTypesRecord, string>;
