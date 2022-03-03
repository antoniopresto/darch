import {
  FinalFieldDefinition,
  InferField,
  ToFinalField,
} from './fields/_parseFields';

export type AnyParsedSchemaDefinition = {
  [K: string]: FinalFieldDefinition;
};

export type ParsedSchemaDefinition<T> = {
  [K in keyof T]: ParsedFieldDefinition<T[K]>;
};

export type Infer<T> = T extends { [K: string]: any }
  ? InferField<{ schema: T }>
  : InferField<T>;

export type ParsedFieldDefinition<T> = ToFinalField<T>;
