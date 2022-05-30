import { assert, IsExact } from 'conditional-type-checks';

import { Infer } from '../Infer';
import { createSchema, Schema } from '../Schema';
import { schemaMetaFieldKey } from '../fields/MetaFieldField';

const userSchema = new Schema({
  name: 'string',
  optional: 'string?',
  age: 'int',
  gender: {
    type: 'enum',
    def: ['male', 'female', 'other'],
    optional: true,
  },

  category: { enum: ['general', 'closed'] },
  '12Enum': { enum: ['1', '2'] },

  enumArray: {
    type: 'enum',
    list: true,
    def: ['1', '2'],
  },
} as const);

describe('Schema', () => {
  beforeEach(() => {
    Schema.register.clear();
  });

  it('handle definition', () => {
    const sut = userSchema.definition;

    expect(sut).toEqual({
      age: {
        list: false,
        optional: false,
        type: 'int',
      },
      category: {
        def: ['general', 'closed'],
        type: 'enum',
        list: false,
        optional: false,
      },
      '12Enum': {
        def: ['1', '2'],
        type: 'enum',
        list: false,
        optional: false,
      },
      enumArray: {
        def: ['1', '2'],
        type: 'enum',
        list: true,
        optional: false,
      },
      gender: {
        optional: true,
        def: ['male', 'female', 'other'],
        type: 'enum',
        list: false,
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      optional: {
        list: false,
        optional: true,
        type: 'string',
      },
      [schemaMetaFieldKey]: expect.anything(),
    });
  });

  it('should validate schema', () => {
    const user = {
      name: 'Antonio',
      age: 1,
      optional: undefined,
      gender: 'male',
      category: 'general',
      '12Enum': '1',
      enumArray: ['1', '2'],
    };

    expect(userSchema.parse(user)).toEqual(user);

    expect(() => userSchema.parse({ ...user, age: undefined })).toThrow(
      `➤ field "age": expected type int, found undefined.`
    );

    expect(() => userSchema.parse({ ...user, enumArray: ['3'] })).toThrow(
      "• enumArray[0] accepted: '1' or '2', found 3."
    );
  });

  it('should validate schema inside schema', () => {
    const subSchema = new Schema({
      mySubField: { enum: ['foo'] },
    } as const);

    const schema = new Schema({
      name: 'string',
      sub: subSchema,
    });

    expect(
      schema.parse({
        name: 'a',
        sub: { mySubField: 'foo' },
      })
    ).toEqual({ name: 'a', sub: { mySubField: 'foo' } });

    expect(() =>
      schema.parse({
        name: 'a',
        sub: { mySubField: 'INVALID' },
      })
    ).toThrow(
      '➤ field "sub": ➤ field "mySubField": accepted: \'foo\', found INVALID.'
    );

    expect(() => schema.parse({ name: 'a', sub: 1 })).toThrow(
      '➤ field "sub": expected object, found number.'
    );

    expect(() => schema.parse({ name: 'a', sub: {} })).toThrow(
      '➤ field "sub": ➤ field "mySubField": expected type enum, found undefined.'
    );
  });

  it('accepts schema as plain definition', () => {
    const rolesSchema = new Schema({
      name: 'string',
      permissions: '[string]',
      status: { enum: ['open', 'closed'] },
    } as const);

    const mySchema = new Schema({
      userId: 'string',
      roles: {
        schema: rolesSchema,
        list: true,
      },
    });

    expect(mySchema.definition.roles.type).toBe('schema');
    expect(mySchema.definition.roles.def).toEqual(rolesSchema.definition);

    expect(() => mySchema.parse({ userId: '123' })).toThrow(
      '➤ field "roles": expected type schema, found undefined.'
    );

    expect(() => mySchema.parse({ userId: '123', roles: [] })).not.toThrow();

    expect(() => mySchema.parse({ userId: '123', roles: [1] })).toThrow(
      '• roles[0] expected object, found number'
    );
  });

  it('accepts schema as field type', () => {
    const rolesSchema = new Schema({
      name: 'string',
      permissions: '[string]',
      status: { enum: ['open', 'closed'] },
    } as const);

    const schema1 = new Schema({
      userId: 'string',
      roles: {
        type: rolesSchema,
        list: true,
      },
    });

    const schema2 = new Schema({
      userId: 'string',
      roles: {
        schema: rolesSchema,
        list: true,
      },
    });

    type T1 = Infer<typeof schema1>;
    type T2 = Infer<typeof schema2>;

    assert<IsExact<T1, T2>>(true);

    expect(schema1.definition).toEqual(schema2.definition);
  });

  test('describe', () => {
    const schema = createSchema({
      name: 'string',
      age: 'int?',
    })
      .describe('my schema desc.')
      .describe({
        name: 'the name field',
        age: 'the age field',
      });

    expect(schema.definition.name.description).toEqual('the name field');
    expect(schema.definition.age.description).toEqual('the age field');
  });

  test('clone', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
    });

    const schema2 = schema1.clone();

    expect(schema1.definition).not.toBe(schema2.definition);
    expect(schema1.definition).toEqual(schema2.definition);
    expect(schema1.definition).toEqual(schema2.definition);
  });

  test('clone using function', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
    });

    const schema2 = schema1.clone((current) => {
      return {
        age: {
          ...current.age,
          list: true,
        },
      };
    });

    type Final = Infer<typeof schema2>;
    assert<IsExact<Final, { age?: number[] | undefined }>>(true);

    expect(schema1.definition).not.toBe(schema2.definition);
    expect(schema2.definition).toEqual({
      age: {
        list: true,
        optional: true,
        type: 'int',
      },
      [schemaMetaFieldKey]: expect.anything(),
    });
  });

  test('removeField', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
      email: 'email',
    });

    const noName = schema1.removeField('name');
    const noEmail = schema1.removeField(['email']);

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    expect(noName.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    type T1 = Infer<typeof schema1>;
    type NoName = Infer<typeof noName>;
    type NoEmail = Infer<typeof noEmail>;

    assert<IsExact<NoName, Omit<T1, 'name'>>>(true);
    assert<IsExact<NoEmail, Omit<T1, 'email'>>>(true);
  });

  test('clone fields', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
      email: 'email',
    });

    const cloneNameAge = schema1.clone(['name', 'age']);

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    expect(cloneNameAge.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
    });

    type T1 = Infer<typeof schema1>;
    type CloneNameAge = Infer<typeof cloneNameAge>;

    assert<IsExact<CloneNameAge, Omit<T1, 'email'>>>(true);
  });

  test('clone fields with transform', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
      email: 'email',
    });

    const clone = schema1.clone(
      ['name', 'email'],
      (v) => {
        return {
          ...v,
          email: null,
          emails: '[email]',
        };
      },
      'identifyMe'
    );

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    expect(clone.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      emails: {
        list: true,
        optional: false,
        type: 'email',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
    });

    type Clone = Infer<typeof clone>;

    assert<IsExact<Clone, { name: string; emails: string[] }>>(true);

    expect(clone.id).toBe('identifyMe');
  });

  test('makeOptional', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
      email: 'email',
    });

    const clone = schema1.makeOptional(['name', 'email']);

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    expect(clone.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: true,
        type: 'string',
      },
      email: {
        list: false,
        optional: true,
        type: 'email',
      },
    });

    type T1 = Infer<typeof schema1>;
    type Clone = Infer<typeof clone>;

    assert<IsExact<Clone, Partial<T1>>>(true);
  });

  test('makeRequired', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
      email: 'email',
    });

    const clone = schema1.makeRequired(['name', 'email', 'age']);

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    expect(clone.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: false,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
    });

    type T1 = Infer<typeof schema1>;
    type Clone = Infer<typeof clone>;

    assert<IsExact<Clone, Required<T1>>>(true);
  });

  test('addFields', () => {
    const schema1 = createSchema({
      name: 'string',
      age: 'int?',
    });

    const withEmail = schema1.addFields({
      email: 'email',
    });

    expect(schema1.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
    });

    expect(withEmail.definition).toEqual({
      [schemaMetaFieldKey]: expect.anything(),
      age: {
        list: false,
        optional: true,
        type: 'int',
      },
      email: {
        list: false,
        optional: false,
        type: 'email',
      },
      name: {
        list: false,
        optional: false,
        type: 'string',
      },
    });

    type T1 = Infer<typeof schema1>;
    type WithEmail = Infer<typeof withEmail>;

    assert<IsExact<WithEmail, T1 & { email: string }>>(true);
  });

  test('number as string input', () => {
    expect(
      createSchema({
        age: 'int',
        weight: 'float',
      }).parse({ age: '32', weight: '83' })
    ).toEqual({
      age: 32,
      weight: 83,
    });
  });

  describe('identify', () => {
    test('identify', () => {
      const schema1 = createSchema({
        name: 'string',
        age: 'int?',
      });

      expect(schema1.id).toBe(null);

      // @ts-ignore
      expect(() => schema1.identify()).toThrow();
      expect(() => schema1.identify('')).toThrow();

      expect(schema1.identify('abc')).toHaveProperty('id', 'abc');
      schema1.identify('abc');
      schema1.identify('abc');
      expect(() => schema1.identify('abcx')).toThrow(
        'Trying to replace existing id "abc"'
      );

      expect(Schema.register.get('abc')).toBe(schema1);
      expect(() => Schema.register.get('yyy')).toThrow(
        'There is no item with key "yyy"'
      );
    });

    test('does not clone id', () => {
      const schema1 = createSchema({
        name: 'string',
        age: 'int?',
      }).identify('abc');

      // @ts-ignore
      expect(schema1.id).toBe('abc');

      // @ts-ignore
      expect(schema1.clone().id).toBe(null);
    });
  });

  test('.entity(name: string) should identify before creating a OTC type', () => {
    const type = createSchema({
      name: 'string',
      age: 'int?',
    }).entity('User');

    expect(type.getType().getFields()).toMatchObject({
      name: { astNode: {} },
      age: { astNode: {} },
    });
  });
});
