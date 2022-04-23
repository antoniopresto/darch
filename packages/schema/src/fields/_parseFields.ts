import { FieldDefinitions, FieldTypeName, TCursor } from './_fieldDefinitions';
import { NullableToPartial } from '@darch/utils/lib/typeUtils';
import { SchemaLike } from './ISchemaLike';

export type SchemaFieldInput =
  | SchemaLike
  | FinalFieldDefinition
  | FieldAsString
  | FlattenFieldDefinition
  | SchemaInputArray
  | Readonly<SchemaInputArray>;
// should update Infer.ts if add any new type here

// https://github.com/microsoft/TypeScript/issues/3496#issuecomment-128553540
interface SchemaInputArray extends Readonly<Array<SchemaFieldInput>> {}

export interface SchemaDefinitionInput {
  [K: string]: SchemaFieldInput;
}

export type InferSchemaDefinition<Def> = NullableToPartial<{
  -readonly [K in keyof Def]: InferField<Def[K]>;
}>;

export type InferField<Input> = GetI<ToFinalField<Input>>;

export type ParseFields<Input> = {
  -readonly [K in keyof Input]: ToFinalField<Input[K]>;
};

export type FinalSchemaDefinition = { [K: string]: FinalFieldDefinition };

export type FinalFieldDefinition = {
  [K in FieldTypeName]: {
    type: K;
    def?: any;
    list?: boolean;
    optional?: boolean;
    description?: string;
    __infer?: any;
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
              __infer: InferSchemaDefinition<Base['schema']['definition']>;
            }
          : //
          //
          Base extends SchemaLike
          ? {
              type: 'schema';
              def: Base['definition'];
              list: false;
              optional: false;
              description: string | undefined;
              __infer: InferSchemaDefinition<Base['definition']>;
            }
          : //

          // === start handling union type ===
          Base extends Array<infer Item> | Readonly<Array<infer Item>>
          ? {
              type: 'union';
              def: Array<Item>;
              list: undefined;
              optional: undefined;
              description: string | undefined;
            }
          : // === end handling union type

          // ==== start handling FieldAsString ====
          Base extends FieldAsString
          ? ParseStringDefinition<Base>
          : // ==== end handling FieldAsString ====

          Base extends {
              type: FieldTypeName;
              def?: infer Def;
              list?: boolean;
              optional?: boolean;
            }
          ? {
              type: Base['type'];
              def: Def;
              list: [Base['list']] extends [true] ? true : undefined;
              optional: [Base['optional']] extends [true] ? true : undefined;
              description: string | undefined;
            }
          : // ==== start handling FieldAsTypeKey ====
            {
              [K in keyof ParseFlattenFieldDef<Base>]: ParseFlattenFieldDef<Base>[K];
            }
      >
    >
  >;

type GetI<T> = T extends { __infer: infer I } ? I : never;

// inject  the `__infer` property
type _injectInfer<T> = T extends {
  type: FieldTypeName;
  def: infer Def;
}
  ? T & {
      __infer: // === recursive schema case ===
      T['type'] extends 'schema'
        ? Def extends { [K: string]: any }
          ? InferSchemaDefinition<Def>
          : never
        : //
        // === recursive union case ===
        T['type'] extends 'union'
        ? Def extends Array<infer Item> | Readonly<Array<infer Item>>
          ? InferField<Item>
          : never
        : //

        // === parsing record type ===
        T['type'] extends 'record'
        ? [Def] extends [undefined]
          ? { [K: string]: any }
          : Def extends { keyType: 'int' | 'float' }
          ? {
              [K: number]: Def extends { type: infer Type }
                ? InferField<Type>
                : any;
            }
          : {
              [K: string]: Def extends { type: infer Type }
                ? InferField<Type>
                : any;
            }
        : //

          // === simple field case
          _inferBasic<T['type'], Def>;
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
type ExtractFlattenDefDef<Input> = {
  def: {
    -readonly [K in keyof Input as K extends FieldTypeName
      ? K
      : never]: Input[K];
  } extends infer P1
    ? P1[keyof P1]
    : Input;
};

type ExtractFlattenDefType<Input> = keyof Input extends infer K
  ? K extends FieldTypeName
    ? { type: K }
    : never
  : never;

type ExtractFlattenDefCommonConfig<Input> = Input extends { [K: string]: any }
  ? {
      list: [Input['list']] extends [true] ? true : false;
      optional: [Input['optional']] extends [true] ? true : false;
      description: [Input['description']] extends ['string']
        ? Input['description']
        : undefined;
    }
  : never;

type ParseFlattenFieldDef<Base> =
  //
  ExtractFlattenDefType<Base> &
    ExtractFlattenDefDef<Base> &
    ExtractFlattenDefCommonConfig<Base>;
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

type _inferBasic<Type, Def = undefined> =
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

    // == parsing enum
    Type extends 'enum'
    ? Def extends Array<infer Val> | Readonly<Array<infer Val>>
      ? Val
      : never
    : never;
