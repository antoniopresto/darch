import { Writeable } from '@darch/utils/dist/typeUtils';

import { FieldType } from '../FieldType';

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

export type ExtractTypeConfig<T> = T extends FieldType<infer Config>
  ? Config
  : never;

export type ExtractTypeDef<T> = T extends FieldType<infer Config>
  ? Config['def']
  : never;

// // If Checking is a valid { [TypeName]: FieldTypeDef } returns
// // the value of IfTrue otherwise returns the value of IfFalse
// export type CheckFieldAsKeyDefinition<
//   Checking extends Record<string, any>,
//   TypeName extends KeyOfFieldTypes,
//   IfTrue,
//   IfFalse
// > = [
//   Exclude<keyof Checking, TypeName | keyof CommonSchemaFieldConfig>
// ] extends [never]
//   ? IfTrue
//   : IfFalse;

// export type FieldKeyAsDefKey<T> = CheckFieldAsKeyDefinition<
//   T,
//   KeyOfFieldTypes,
//   {
//     type: Exclude<keyof T, keyof CommonSchemaFieldConfig>;
//     def: T[Exclude<keyof T, keyof CommonSchemaFieldConfig>];
//     config: T[Exclude<keyof T, keyof CommonSchemaFieldConfig>]; // FIXME config inteira como tipar isso de forma segura, ver sugestoes do TS
//   },
//   never
// >;
