import { memoize } from '@darch/utils/dist/memoize';

import { FieldDefinitionConfig, SchemaDefinitionInput } from '../TSchemaConfig';

import { AnyField } from './AnyField';
import { BooleanField } from './BooleanField';
import { CursorField } from './CursorField';
import { DateField } from './DateField';
import { EmailField } from './EmailField';
import { EnumField } from './EnumField';
import { FloatField } from './FloatField';
import { IntField } from './IntField';
import { RecordField, RecordFieldDef } from './RecordField';
import { StringField } from './StringField';
import { SubSchemaField } from './SubSchema';
import { UlidField } from './UlidField';
import { UndefinedField } from './UndefinedField';
import { UnionField } from './UnionField';
import { UnknownField } from './UnknownField';

export const fieldTypeConstructors = {
  int: IntField,
  float: FloatField,
  string: StringField,
  boolean: BooleanField,
  enum: EnumField,
  union: UnionField,
  schema: SubSchemaField,
  email: EmailField,
  ulid: UlidField,
  cursor: CursorField,
  date: DateField,
  unknown: UnknownField,
  any: AnyField,
  undefined: UndefinedField,
  record: RecordField,
};

export type FieldTypes = {
  boolean: BooleanField;
  cursor: CursorField;
  date: DateField;
  email: EmailField;
  enum: EnumField<string, [string, ...Array<string>]>;
  union: UnionField<FieldDefinitionConfig, [FieldDefinitionConfig, ...Array<FieldDefinitionConfig>]>;
  schema: SubSchemaField<SchemaDefinitionInput>;
  float: FloatField;
  int: IntField;
  string: StringField;
  ulid: UlidField;
  unknown: UnknownField;
  any: AnyField;
  undefined: UndefinedField;
  record: RecordField<RecordFieldDef>;
};

export type FieldTypeName = keyof FieldTypes;
export type AnyFieldTypeInstance = FieldTypes[FieldTypeName];

function _isFieldTypeName(t: any): t is FieldTypeName {
  return typeof t === 'string' && fieldTypeConstructors.hasOwnProperty(t);
}

export const isFieldTypeName = memoize(_isFieldTypeName);
