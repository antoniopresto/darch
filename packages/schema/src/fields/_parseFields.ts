import {
  FieldTypeName,
  FieldDefinitions,
  InferFieldType,
} from './_fieldDefinitions';
import { NullableToPartial } from '@darch/utils/dist/typeUtils';

type SchemaLike = {
  definition: any;
  __isDarchSchema: true;
  _infer: any;
};

export type SchemaFieldInput =
  | SchemaLike
  | FinalFieldDefinition
  | FieldAsString
  | FlattenFieldDefinition
  | SchemaInputArray
  | Readonly<SchemaInputArray>;
// https://github.com/microsoft/TypeScript/issues/3496#issuecomment-128553540
interface SchemaInputArray extends Array<SchemaFieldInput> {}

export interface SchemaDefinitionInput {
  [K: string]: SchemaFieldInput | Readonly<SchemaFieldInput>;
}

export type InferField<Input> = GetI<ToFinalField<Input>>;

export type ParseFields<Input> = {
  -readonly [K in keyof Input]: ToFinalField<Input[K]>;
};

export type FinalFieldDefinition = {
  [K in FieldTypeName]: {
    type: K;
    def: any; // TODO can infer or will go infinite looping
    list?: boolean;
    optional?: boolean;
    description?: string;
    __infer: unknown;
  };
}[FieldTypeName];

export type FlattenFieldDefinition = {
  [type in FieldTypeName]: {
    [K in type]: FieldDefinitions[K];
  };
}[FieldTypeName];

export type FieldAsString =
  | FieldTypeName
  | `${FieldTypeName}?`
  | `[${FieldTypeName}]`
  | `[${FieldTypeName}]?`;

export type ToFinalField<Base> =
  //
  _handleOptional<
    _handleList<
      _injectInfer<
        //
        // ==== start handling fieldType instance ====
        Base extends { __isFieldType: true; parsed: infer Parsed }
          ? Parsed
          : // === end handling fieldType instance

          Base extends {
              schema: SchemaLike;
              list?: infer List;
              optional?: infer Optional;
            }
          ? {
              type: 'schema';
              def: Base['schema']['definition'];
              list: [List] extends [true] ? true : false;
              optional: [Optional] extends [true] ? true : false;
              __infer: Base['schema']['_infer'];
            }
          : //
          //
          Base extends {
              __isDarchSchema: true;
              definition: infer Parsed;
              _infer: infer Infer;
            }
          ? {
              type: 'schema';
              def: Parsed;
              list: false;
              optional: false;
              description: string | undefined;
              __infer: Infer;
            }
          : //

          // === start handling union type ===
          Base extends Array<infer Item> | Readonly<Array<infer Item>>
          ? {
              type: 'union';
              def: Array<Base[number]>;
              list: Item extends { list: true } ? true : undefined;
              optional: Item extends { optional: true } ? true : undefined;
              description: string | undefined;
            }
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

type GetI<T> = T extends { __infer: infer I } ? I : never;

// inject  the `__infer` property
type _injectInfer<T> = T extends { __infer: {} }
  ? T
  : T extends {
      type: FieldTypeName;
      def: infer Def;
    }
  ? {
      [K in keyof T | '__infer']: K extends '__infer' //
        ? //
          // === recursive schema case ===
          T['type'] extends 'schema'
          ? Def extends { [K: string]: any }
            ? NullableToPartial<{
                -readonly [K in keyof Def]: InferField<Def[K]>;
              }>
            : never
          : //
          // === recursive union case ===
          T['type'] extends 'union'
          ? Def extends Array<infer Item> | Readonly<Array<infer Item>>
            ? GetI<ToFinalField<Item>>
            : never
          : //

            // === simple field case
            InferFieldType<T['type'], Def>
        : // end infer
          T[Exclude<K, '__infer'>];
    }
  : never;

type _handleList<T> = T extends {
  __infer: infer Infer;
  list?: infer List;
}
  ? [List] extends [true]
    ? {
        [K in keyof T | '__infer']: K extends '__infer' ? Infer[] : T[K];
      }
    : T
  : never;

type _handleOptional<T> = T extends {
  __infer: infer Infer;
  optional?: infer Optional;
}
  ? [Optional] extends [true]
    ? {
        [K in keyof T | '__infer']: K extends '__infer'
          ? Infer | undefined
          : T[K];
      }
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
