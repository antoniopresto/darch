import { memoize } from '@darch/utils/dist/memoize';

import { AnyField } from './AnyField';
import { BooleanField } from './BooleanField';
import { CursorField } from './CursorField';
import { DateField } from './DateField';
import { EmailField } from './EmailField';
import { EnumField } from './EnumField';
import { FloatField } from './FloatField';
import { IntField } from './IntField';
import { RecordField } from './RecordField';
import { StringField } from './StringField';
import { SubSchemaField } from './SubSchema';
import { UlidField } from './UlidField';
import { UndefinedField } from './UndefinedField';
import { UnionField } from './UnionField';
import { UnknownField } from './UnknownField';

import { NullField } from './NullField';
import { FieldTypeName } from './_fieldDefinitions';

function createConstructors<T extends { [K in FieldTypeName]: any }>(
  input: T
): T {
  const res = Object.create(null);
  Object.entries(input).forEach(([k, val]) => (res[k] = val));
  Object.freeze(res);
  return res;
}

export const fieldTypeConstructors = createConstructors({
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
  null: NullField,
});

function _isFieldTypeName(t: any): t is FieldTypeName {
  return typeof t === 'string' && fieldTypeConstructors[t];
}

export const isFieldTypeName = memoize(_isFieldTypeName);
