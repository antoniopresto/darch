import {
  FieldAsString,
  FinalFieldDefinition,
  InferField,
} from './fields/_parseFields';
import { SchemaLike } from './fields/ISchemaLike';

export type Infer<T> = T extends SchemaLike
  ? InferField<{ type: 'schema'; def: T['definition'] }>
  : T extends FinalFieldDefinition
  ? InferField<T>
  : T extends FieldAsString
  ? InferField<T>
  : T extends FinalFieldDefinition
  ? InferField<T>
  : T extends any[]
  ? InferField<T[number]>
  : T extends Readonly<any[]>
  ? InferField<T[number]>
  : T extends { [K: string]: any }
  ? InferField<{ type: 'schema'; def: T }>
  : never;
