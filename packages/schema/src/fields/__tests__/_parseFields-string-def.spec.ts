import { assert, IsExact } from 'conditional-type-checks';

import { TCursor } from '../_fieldDefinitions';
import { InferField } from '../_parseFields';

type AnyRecord = { [K: string]: any };

// ====== SIMPLE STRING DEF =======
//   any:
assert<IsExact<InferField<'any'>, any>>(true);

//   boolean:
type TBoolean = InferField<'boolean'>;
assert<IsExact<TBoolean, boolean>>(true);

//   cursor:
assert<IsExact<InferField<'cursor'>, TCursor>>(true); //   date:

//   date
assert<IsExact<InferField<'date'>, Date>>(true);

//   email:
assert<IsExact<InferField<'email'>, string>>(true);

//   float:
assert<IsExact<InferField<'float'>, number>>(true);

//   int:
assert<IsExact<InferField<'int'>, number>>(true);

//   null:
assert<IsExact<InferField<'null'>, null>>(true);

//   record:
assert<IsExact<InferField<'record'>, AnyRecord>>(true);

//   string:
assert<IsExact<InferField<'string'>, string>>(true);

//   ulid:
assert<IsExact<InferField<'ulid'>, string>>(true);

//   undefined:
assert<IsExact<InferField<'undefined'>, undefined>>(true);

//   unknown:
assert<IsExact<InferField<'unknown'>, unknown>>(true);

//   schema:
type TSchema = InferField<'schema'>;
assert<IsExact<TSchema, never>>(true);

//   union:
assert<IsExact<InferField<'union'>, never>>(true);

//   enum:
assert<IsExact<InferField<'enum'>, never>>(true);
//

// ====== LIST STRING DEF =======
//   any:
assert<IsExact<InferField<'[any]'>, any[]>>(true);

//   boolean:
assert<IsExact<InferField<'[boolean]'>, boolean[]>>(true);

//   cursor:
assert<IsExact<InferField<'[cursor]'>, TCursor[]>>(true); //   date:

//   date
assert<IsExact<InferField<'[date]'>, Date[]>>(true);

//   email:
assert<IsExact<InferField<'[email]'>, string[]>>(true);

//   float:
assert<IsExact<InferField<'[float]'>, number[]>>(true);

//   int:
assert<IsExact<InferField<'[int]'>, number[]>>(true);

//   null:
type TNullList = InferField<'[null]'>;
assert<IsExact<TNullList, null[]>>(true);

//   record:
assert<IsExact<InferField<'[record]'>, AnyRecord[]>>(true);

//   string:
assert<IsExact<InferField<'[string]'>, string[]>>(true);

//   ulid:
assert<IsExact<InferField<'[ulid]'>, string[]>>(true);

//   undefined:
assert<IsExact<InferField<'[undefined]'>, undefined[]>>(true);

//   unknown:
assert<IsExact<InferField<'[unknown]'>, unknown[]>>(true);

//   schema:
assert<IsExact<InferField<'[schema]'>, never[]>>(true);

//   union:
assert<IsExact<InferField<'[union]'>, never[]>>(true);

//   enum:
assert<IsExact<InferField<'[enum]'>, never[]>>(true);
//

// ====== LIST OPTIONAL STRING DEF =======
//   any:
assert<IsExact<InferField<'[any]?'>, any[] | undefined>>(true);

//   boolean:
assert<IsExact<InferField<'[boolean]?'>, boolean[] | undefined>>(true);

//   cursor:
assert<IsExact<InferField<'[cursor]?'>, TCursor[] | undefined>>(true); //   date:

//   date
assert<IsExact<InferField<'[date]?'>, Date[] | undefined>>(true);

//   email:
assert<IsExact<InferField<'[email]?'>, string[] | undefined>>(true);

//   float:
assert<IsExact<InferField<'[float]?'>, number[] | undefined>>(true);

//   int:
assert<IsExact<InferField<'[int]?'>, number[] | undefined>>(true);

//   null:
assert<IsExact<InferField<'[null]?'>, null[] | undefined>>(true);

//   record:
assert<IsExact<InferField<'[record]?'>, AnyRecord[] | undefined>>(true);

//   string:
type TStringOptList = InferField<'[string]?'>;
assert<IsExact<TStringOptList, string[] | undefined>>(true);

//   ulid:
assert<IsExact<InferField<'[ulid]?'>, string[] | undefined>>(true);

//   undefined:
assert<IsExact<InferField<'[undefined]?'>, undefined[] | undefined>>(true);

//   unknown:
type TUnknownOptList = InferField<'[unknown]?'>;
assert<IsExact<TUnknownOptList, unknown[] | undefined>>(true);

//   schema:
assert<IsExact<InferField<'[schema]?'>, never[] | undefined>>(true);

//   union:
assert<IsExact<InferField<'[union]?'>, never[] | undefined>>(true);

//   enum:
assert<IsExact<InferField<'[enum]?'>, never[] | undefined>>(true);
