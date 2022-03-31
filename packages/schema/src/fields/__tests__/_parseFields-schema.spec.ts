import { assert, IsExact } from 'conditional-type-checks';

import { TCursor } from '../_fieldDefinitions';
import { InferField } from '../_parseFields';

type AnyRecord = { [K: string]: any };

test('ParseFields schema typings', () => {
  // ====== SIMPLE STRING DEF =======
  //   any:
  assert<IsExact<InferField<{ schema: { name: 'any' } }>, { name: any }>>(true);

  //   boolean:
  type TBoolean = InferField<{ schema: { name: 'boolean' } }>;
  assert<IsExact<TBoolean, { name: boolean }>>(true);

  //   cursor:
  type TTCursor = InferField<{ schema: { name: 'cursor' } }>;
  assert<IsExact<TTCursor, { name: TCursor }>>(true); //   date:

  //   date
  assert<IsExact<InferField<{ schema: { name: 'date' } }>, { name: Date }>>(
    true
  );

  //   email:
  assert<IsExact<InferField<{ schema: { name: 'email' } }>, { name: string }>>(
    true
  );

  //   float:
  assert<IsExact<InferField<{ schema: { name: 'float' } }>, { name: number }>>(
    true
  );

  //   int:
  assert<IsExact<InferField<{ schema: { name: 'int' } }>, { name: number }>>(
    true
  );

  //   null:
  assert<IsExact<InferField<{ schema: { name: 'null' } }>, { name: null }>>(
    true
  );

  //   record:
  assert<
    IsExact<InferField<{ schema: { name: 'record' } }>, { name: AnyRecord }>
  >(true);

  //   string:
  assert<IsExact<InferField<{ schema: { name: 'string' } }>, { name: string }>>(
    true
  );

  //   ulid:
  assert<IsExact<InferField<{ schema: { name: 'ulid' } }>, { name: string }>>(
    true
  );

  //   undefined:
  assert<
    IsExact<InferField<{ schema: { name: 'undefined' } }>, { name?: undefined }>
  >(true);

  //   unknown:
  assert<
    IsExact<InferField<{ schema: { name: 'unknown' } }>, { name: unknown }>
  >(true);

  //   invalid schema:
  type TSchema = InferField<{ schema: { name: 'schema' } }>;
  assert<IsExact<TSchema, { name: never }>>(true);

  //   union:
  assert<IsExact<InferField<{ schema: { name: 'union' } }>, { name: never }>>(
    true
  );
  type TSUnion = InferField<{ schema: { name: ['string', 'int'] } }>;
  assert<IsExact<TSUnion, { name: string | number }>>(true);

  //   enum:
  type TSEnum = InferField<{ schema: { name: { enum: ['a', 'b'] } } }>;
  assert<IsExact<TSEnum, { name: 'a' | 'b' }>>(true);
  //

  // ====== LIST STRING DEF =======
  //   any:
  assert<IsExact<InferField<{ schema: { name: '[any]' } }>, { name: any[] }>>(
    true
  );

  //   boolean:
  assert<
    IsExact<InferField<{ schema: { name: '[boolean]' } }>, { name: boolean[] }>
  >(true);

  //   cursor:
  assert<
    IsExact<InferField<{ schema: { name: '[cursor]' } }>, { name: TCursor[] }>
  >(true); //   date:

  //   date
  assert<IsExact<InferField<{ schema: { name: '[date]' } }>, { name: Date[] }>>(
    true
  );

  //   email:
  assert<
    IsExact<InferField<{ schema: { name: '[email]' } }>, { name: string[] }>
  >(true);

  //   float:
  assert<
    IsExact<InferField<{ schema: { name: '[float]' } }>, { name: number[] }>
  >(true);

  //   int:
  assert<
    IsExact<InferField<{ schema: { name: '[int]' } }>, { name: number[] }>
  >(true);

  //   null:
  type TNullList = InferField<{ schema: { name: '[null]' } }>;
  assert<IsExact<TNullList, { name: null[] }>>(true);

  //   record:
  assert<
    IsExact<InferField<{ schema: { name: '[record]' } }>, { name: AnyRecord[] }>
  >(true);

  //   string:
  assert<
    IsExact<InferField<{ schema: { name: '[string]' } }>, { name: string[] }>
  >(true);

  //   ulid:
  assert<
    IsExact<InferField<{ schema: { name: '[ulid]' } }>, { name: string[] }>
  >(true);

  //   undefined:
  assert<
    IsExact<
      InferField<{ schema: { name: '[undefined]' } }>,
      { name: undefined[] }
    >
  >(true);

  //   unknown:
  assert<
    IsExact<InferField<{ schema: { name: '[unknown]' } }>, { name: unknown[] }>
  >(true);

  //   schema:
  assert<
    IsExact<InferField<{ schema: { name: '[schema]' } }>, { name: never[] }>
  >(true);

  //   union:
  assert<
    IsExact<InferField<{ schema: { name: '[union]' } }>, { name: never[] }>
  >(true);

  //   enum:
  assert<
    IsExact<InferField<{ schema: { name: '[enum]' } }>, { name: never[] }>
  >(true);
  //

  // ====== LIST OPTIONAL STRING DEF =======
  //   any:
  assert<
    IsExact<
      InferField<{ schema: { name: '[any]?' } }>,
      { name?: any[] | undefined }
    >
  >(true);

  //   boolean:
  assert<
    IsExact<
      InferField<{ schema: { name: '[boolean]?' } }>,
      { name?: boolean[] | undefined }
    >
  >(true);

  //   cursor:
  assert<
    IsExact<
      InferField<{ schema: { name: '[cursor]?' } }>,
      { name?: TCursor[] | undefined }
    >
  >(true); //   date:

  //   date
  assert<
    IsExact<
      InferField<{ schema: { name: '[date]?' } }>,
      { name?: Date[] | undefined }
    >
  >(true);

  //   email:
  assert<
    IsExact<
      InferField<{ schema: { name: '[email]?' } }>,
      { name?: string[] | undefined }
    >
  >(true);

  //   float:
  assert<
    IsExact<
      InferField<{ schema: { name: '[float]?' } }>,
      { name?: number[] | undefined }
    >
  >(true);

  //   int:
  assert<
    IsExact<
      InferField<{ schema: { name: '[int]?' } }>,
      { name?: number[] | undefined }
    >
  >(true);

  //   null:
  assert<
    IsExact<
      InferField<{ schema: { name: '[null]?' } }>,
      { name?: null[] | undefined }
    >
  >(true);

  //   record:
  assert<
    IsExact<
      InferField<{ schema: { name: '[record]?' } }>,
      { name?: AnyRecord[] | undefined }
    >
  >(true);

  //   string:
  type TStringOptList = InferField<{ schema: { name: '[string]?' } }>;
  assert<IsExact<TStringOptList, { name?: string[] | undefined }>>(true);

  //   ulid:
  type TUlid = InferField<{ schema: { name: '[ulid]?' } }>;
  assert<IsExact<TUlid, { name?: string[] | undefined }>>(true);

  //   undefined:
  assert<
    IsExact<
      InferField<{ schema: { name: '[undefined]?' } }>,
      { name?: undefined[] | undefined }
    >
  >(true);

  //   unknown:
  type TUnknownOptList = InferField<{ schema: { name: '[unknown]?' } }>;
  assert<IsExact<TUnknownOptList, { name?: unknown[] | undefined }>>(true);

  //   schema:
  assert<
    IsExact<
      InferField<{ schema: { name: '[schema]?' } }>,
      { name?: never[] | undefined }
    >
  >(true);

  //   union:
  assert<
    IsExact<
      InferField<{ schema: { name: '[union]?' } }>,
      { name?: never[] | undefined }
    >
  >(true);

  //   enum:
  assert<
    IsExact<
      InferField<{ schema: { name: '[enum]?' } }>,
      { name?: never[] | undefined }
    >
  >(true);
});
