import { FieldTypeName, FieldTypesRecord } from './_fieldDefinitions';
import { IsNullable, OnlyKnown, Simplify } from '@darch/utils/dist/typeUtils';

export type SchemaFieldInput =
  | FinalFieldDefinition
  | FieldAsString
  | FlattenFieldDefinition
  | SchemaFieldInput[];

export type InferField<Input> = ToFinalField<Input>['__infer'];

export type ParseFields<Input> = {
  -readonly [K in keyof Input]: ToFinalField<Input[K]>;
};

export type FinalFieldDefinition = {
  [K in FieldTypeName]: {
    type: K;
    def: FieldTypesRecord[K][0];
    list?: boolean;
    optional?: boolean;
    description?: string;
    __infer: unknown;
  };
}[FieldTypeName];

export type FlattenFieldDefinition = {
  [type in FieldTypeName]: {
    [K in type]: FieldTypesRecord[K] extends { def: infer Def }
      ? Def | Readonly<Def>
      : never;
  };
}[FieldTypeName];

export type FieldAsString =
  | FieldTypeName
  | `${FieldTypeName}?`
  | `[${FieldTypeName}]`
  | `[${FieldTypeName}]?`;

export type ToFinalField<Base> = _handleOptional<
  _handleList<
    _injectInfer<
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
              def: ToFinalField<Item>[];
              list: Item extends { list: true } ? true : undefined;
              optional: Item extends { optional: true } ? true : undefined;
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
    >
  >
>;

// inject  the `__infer` property
type _injectInfer<T> = T extends { __infer: {} }
  ? T
  : T extends {
      type: FieldTypeName;
      def: infer Def;
    }
  ? T & {
      __infer: IsNullable<FieldTypesRecord<any>[T['type']][0]> extends true
        ? FieldTypesRecord<Def>[T['type']][1]
        : // don't try to infer fields where definition is
        // required (union, schema..) when def is invalid
        [OnlyKnown<Def>] extends [never]
        ? never
        : FieldTypesRecord<Def>[T['type']][1];
    }
  : never;

type Molejo<A, B> = Simplify<Omit<A, keyof B> & B>;

type _handleList<T> = T extends {
  __infer: infer Infer;
  list?: infer List;
}
  ? [List] extends [true]
    ? Molejo<T, { __infer: Infer[] }>
    : T
  : never;

type _handleOptional<T> = T extends {
  __infer: infer Infer;
  optional?: infer Optional;
}
  ? [Optional] extends [true]
    ? Molejo<T, { __infer: Infer | undefined }>
    : T
  : never;

// ==== end handling FieldAsTypeKey ====
// === END ParseField == //

// ==== start parsing FieldAsTypeKey utils ====
type ExtractSingleKeyDef<Input> = Input extends {
  [K in keyof Input as K extends FieldTypeName ? K : never]: infer Def;
}
  ? [keyof Def] extends [never]
    ? { def: undefined }
    : { def: Def }
  : never;

type ExtractSingleKeyType<Input> = keyof Input extends infer K
  ? K extends FieldTypeName
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
