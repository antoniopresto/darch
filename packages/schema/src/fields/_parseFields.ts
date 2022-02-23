import { Simplify } from '@darch/utils/dist/typeUtils';

import { FieldTypeNames, FieldTypesRecord } from './_fieldDefinitions';
import { FieldTypeName } from './fieldTypes';

export type ParseFields<Fields extends Record<string, SchemaFieldInput>> = {
  [K in keyof Fields]: ParseField<Fields[K]>;
};

export type SchemaFieldInput =
  | ParsedFieldDef
  | FieldAsString
  | FieldAsTypeKey
  | SchemaFieldInput[];

export type ParseFieldInput<Input> = {
  -readonly [K in keyof Input]: ParseField<Input[K]>['__infer'];
};

// type P = ParseFieldInput<{
//   unUn: ['int', 'undefined'];
//   unUn2: ['int?', 'string'];
//   a: 'string';
//   b: '[int]?';
//   mail: 'email';
//   en: { enum: ['a', 'b'] };
//   un: [
//     { enum: ['a', 'b'] },
//     'int',
//     'undefined',
//     { schema: { name: 'string'; age: 'int' } }
//   ];
// }>;

export type FieldAsTypeKey = {
  [type in FieldTypeNames]: {
    [K in type]: FieldTypesRecord[K] extends { def: infer Def }
      ? Def | Readonly<Def>
      : never;
  };
}[FieldTypeNames];

export type FieldAsString =
  | FieldTypeName
  | `${FieldTypeName}?`
  | `[${FieldTypeName}]`
  | `[${FieldTypeName}]?`;

export type ParsedFieldDef = {
  [K in FieldTypeNames]: {
    type: K;
    def: FieldTypesRecord[K]['def'];
    list?: boolean;
    optional?: boolean;
    description?: string;
    __infer: unknown;
  };
}[FieldTypeNames];

type ParsedWithInfer<T> = T extends { type: FieldTypeNames; def: infer Def }
  ? Simplify<
      T & {
        // TODO handle list, optional - no infer
        __infer: T['type'] extends 'schema'
          ? {
              [K in keyof Def]: ParseField<Def[K]>['__infer'];
            }
          : FieldTypesRecord<Def>[T['type']]['__infer'];
      }
    >
  : never;

type P = ParseField<{ union: ['int?'] }>;

type ParseField<Base> = ParsedWithInfer<
  //
  // ==== start handling fieldType instance ====
  Base extends { __isFieldType: true; parsed: infer Parsed }
    ? Parsed
    : // === end handling fieldType instance

    // === start handling union type ===
    Base extends Array<infer Item> | Readonly<Array<infer Item>>
    ? Item extends SchemaFieldInput
      ? {
          type: 'union';
          def: ParseField<Item>[];
          // TODO handle list, optional, etc here?? organize where each step is parsed
          list: boolean;
          optional: boolean;
          description: string;
        }
      : never
    : // === end handling union type

    // ==== start handling FieldAsString ====
    Base extends FieldAsString
    ? ParseStringDefinition<Base>
    : // ==== end handling FieldAsString ====

      // ==== start handling FieldAsTypeKey ====
      {
        [K in keyof ParseFieldAsKey<Base>]: ParseFieldAsKey<Base>[K];
      }
>;
// ==== end handling FieldAsTypeKey ====
// === END ParseField == //

// ==== start parsing FieldAsTypeKey utils ====
type ExtractSingleKeyDef<Input> = Input extends {
  [K in keyof Input as K extends FieldTypeNames ? K : never]: infer Def;
}
  ? [keyof Def] extends [never]
    ? { def: undefined }
    : { def: Def }
  : never;

type ExtractSingleKeyType<Input> = keyof Input extends infer K
  ? K extends FieldTypeNames
    ? { type: K }
    : never
  : never;

type ExtractSingleKeyCommonConfig<Input extends Record<string, any>> = {
  list: [Input['list']] extends [true] ? true : false;
  optional: [Input['optional']] extends [true] ? true : false;
  description: [Input['description']] extends ['string']
    ? Input['description']
    : undefined;
};

type ParseFieldAsKey<Base> =
  //
  ExtractSingleKeyType<Base> &
    ExtractSingleKeyDef<Base> &
    ExtractSingleKeyCommonConfig<Base>;
// ==== end parsing FieldAsTypeKey utils ====

// ==== start FieldAsString utils ====
type _ExtractFieldAsString<T extends FieldAsString> =
  //
  T extends FieldTypeName
    ? T
    : T extends `[${infer U}]?`
    ? U
    : T extends `${infer U}?`
    ? U
    : T extends `[${infer U}]`
    ? U
    : never;

type ParseStringDefinition<S> =
  //
  S extends FieldTypeName
    ? {
        type: S;
        list: false;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    //
    S extends `${FieldTypeName}?`
    ? //
      {
        type: _ExtractFieldAsString<S>;
        list: false;
        optional: true;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]`
    ? //
      {
        type: _ExtractFieldAsString<S>;
        list: true;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]?`
    ? //
      {
        type: _ExtractFieldAsString<S>;
        list: true;
        optional: true;
        def: undefined;
        description?: string;
      }
    : never;
// ==== start FieldAsString utils ====
