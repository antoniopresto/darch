import { createSchema } from '../Schema';
import { StringField } from '../fields/StringField';

const schema1 = createSchema({
  name: 'string',
  age: 'int?',
  favorites: '[string]',
  sex: ['m', 'f', 'o'],
} as const);

const schema2 = createSchema({
  name: 'string',
  sub: schema1,
});

const stringDefTypes = {
  stringDefBoolean: 'boolean',
  stringDefBooleanList: '[boolean]',
  stringDefBooleanListOptional: '[boolean]?',
  stringDefCursor: 'cursor',
  stringDefCursorList: '[cursor]',
  stringDefCursorListOptional: '[cursor]?',
  stringDefDate: 'date',
  stringDefDateList: '[date]',
  stringDefDateListOptional: '[date]?',
  stringDefEmail: 'email',
  stringDefEmailList: '[email]',
  stringDefEmailListOptional: '[email]?',
  stringDefFloat: 'float',
  stringDefFloatList: '[float]',
  stringDefFloatListOptional: '[float]?',
  stringDefInt: 'int',
  stringDefIntList: '[int]',
  stringDefIntListOptional: '[int]?',
  stringDefString: 'string',
  stringDefStringList: '[string]',
  stringDefStringListOptional: '[string]?',
  stringDefUlid: 'ulid',
  stringDefUlidList: '[ulid]',
  stringDefUlidListOptional: '[ulid]?',
  stringDefUnknown: 'unknown',
  stringDefUnknownList: '[unknown]',
  stringDefUnknownListOptional: '[unknown]?',
} as const;

const typeDefs = {
  enumStringArray: ['a', 'b', 'c'],
  schemaTypeName: {
    type: 'schema',
    def: schema2['definition'],
  },
  schemaObjectAsType: {
    type: schema2,
    optional: true,
    list: true,
  },
  stringFieldDefinition: {
    type: 'cursor',
    list: true,
    optional: true,
  },
  fieldDefAsType: StringField.create({ min: 1, max: 2 }).toList().optional(),
  ...stringDefTypes,
} as const;

export const schemaMocks = {
  schema1,
  schema2,
  stringDefTypes,
  typeDefs,
};
