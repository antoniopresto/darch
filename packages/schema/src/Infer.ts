import {
  FieldAsString,
  FinalFieldDefinition,
  InferField,
  SchemaLike,
} from './fields/_parseFields';

export type Infer<T> = T extends SchemaLike
  ? InferField<{ type: 'schema'; def: T['definition'] }>
  : T extends FinalFieldDefinition
  ? InferField<T>
  : T extends FieldAsString
  ? InferField<T>
  : T extends FinalFieldDefinition
  ? InferField<T>
  : T extends any[]
  ? InferField<T>
  : T extends Readonly<any[]>
  ? InferField<T>
  : T extends { [K: string]: any }
  ? InferField<{ type: 'schema'; def: T }>
  : never;
