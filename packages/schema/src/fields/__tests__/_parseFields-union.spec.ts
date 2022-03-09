import { InferField } from '../_parseFields';
import { assert, IsExact } from 'conditional-type-checks';
import { Schema } from '../../Schema';

type TUnion = InferField<{ schema: { name: ['string', 'int'] } }>;
assert<IsExact<TUnion, { name: string | number }>>(true);

type TUnionList = InferField<{
  schema: { name: ['string', 'int'] };
  list: true;
}>;
assert<IsExact<TUnionList, { name: string | number }[]>>(true);

type TUnionListOptional = InferField<{
  schema: { name: ['string', 'int'] };
  list: true;
  optional: true;
}>;
assert<IsExact<TUnionListOptional, { name: string | number }[] | undefined>>(
  true
);

type TUnionListOptionalItem = InferField<{
  schema: { name: ['string', 'int?'] };
  list: true;
  optional: true;
}>;
assert<
  IsExact<TUnionListOptionalItem, { name?: string | number }[] | undefined>
>(true);

assert<
  IsExact<TUnionListOptionalItem, { name?: string | number }[] | undefined>
>(true);

type SampleSchema = Schema<{
  street: 'string';
  number: 'int?';
}>

type AddressSchema = InferField<{
  schema: {
    name: 'string'; // any string
    email: 'email?'; // email type - will validate against email regex
    age: 'int?'; // optional integer
    notes: '[int]?';

    // declaring a union field - will infer as `string | undefined | number[]`
    unionField: ['string?', '[int]?'];

    // represents an enum
    letter: { enum: ['a', 'b', 'c'] };

    // more detailed way to define enums
    letterOptionalList: {
      enum: ['x', 'y', 'z'];
      optional: true;
      list: true;
    };

    // using a previous schema as field type
    optionalAddress: {
      type: SampleSchema;
      optional: true;
    };

    // another way to define schema fields
    deliveryAddress: {
      schema: SampleSchema;
    };
  };
}>;

assert<
  IsExact<
    AddressSchema,
    {
      name: string;
      email?: string | undefined;
      age?: number | undefined;
      notes?: number[] | undefined;
      unionField?: string | number[] | undefined;
      letter: 'a' | 'b' | 'c';
      letterOptionalList?: ('x' | 'y' | 'z')[] | undefined;
      optionalAddress?:
        | {
            street: string;
            number?: number | undefined;
          }
        | undefined;

      deliveryAddress: {
        street: string;
        number?: number | undefined;
      };
    }
  >
>(true);
