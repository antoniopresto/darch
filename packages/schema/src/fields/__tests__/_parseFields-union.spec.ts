import { InferField } from '../_parseFields';
import { assert, IsExact } from 'conditional-type-checks';
import { Schema } from '../../Schema';

test('infer union types', () => {
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
    days: { enum: ['0', '1']; list: true; optional: true };
    add: { schema: { name: 'string' } };
    addListOptional: {
      schema: {
        name: 'string';
        uni: [
          { enum: ['a', 'b'] }, //
          'int'
        ];
      };
      list: true;
      optional: true;
    };
  }>;

  type TSampleSchemaInfer = InferField<SampleSchema>;

  type TSampleSchema = {
    street: string;
    number?: number | undefined;
    days?: ('0' | '1')[] | undefined;
    add: { name: string };
    addListOptional?:
      | {
          name: string;
          uni: 'a' | 'b' | number;
        }[]
      | undefined;
  };

  assert<IsExact<TSampleSchema, TSampleSchemaInfer>>(true);

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
        schema: SampleSchema;
        optional: true;
      };

      // another way to define schema fields
      deliveryAddress: SampleSchema;
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
        optionalAddress?: TSampleSchema | undefined;
        deliveryAddress: TSampleSchema;
      }
    >
  >(true);
});
