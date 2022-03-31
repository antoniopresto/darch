import { FieldType, FieldTypeParser } from '../FieldType';
import type { Schema } from '../Schema';
import {Infer} from "../Infer";

const def = {
  pk: 'string',
  prefix: 'string',
  delimiter: 'string',
  limit: 'int?',
  after: 'string?',
  fields: '[string]?',
} as const;

type CursorDef = typeof def;

export type CursorType = Infer<CursorDef>;

let cursorSchema: Schema<CursorDef> | undefined;

function getCursorSchema() {
  // circular dependency
  const { createSchema } = require('../Schema');
  cursorSchema = cursorSchema || createSchema(def);
  return cursorSchema;
}

export class CursorField extends FieldType<CursorType, 'cursor', undefined> {
  parse: FieldTypeParser<CursorType>;

  get schema() {
    return getCursorSchema()!;
  }

  static schema() {
    return getCursorSchema()!;
  }

  constructor() {
    super('cursor', undefined);

    const parser = this.schema.parse.bind(this.schema);

    this.parse = this.applyParser({
      parse: (value) => {
        if (typeof value !== 'object') {
          throw new Error(`Expected cursor, found ${value}`);
        }

        return parser(value);
      },
    });
  }

  static create = (): CursorField => {
    return new CursorField();
  };

  graphql = () => ({
    name: 'Cursor',
    fields: {
      pk: 'String!',
      prefix: 'String!',
      delimiter: 'String',
      limit: 'Int',
      after: 'String',
      fields: '[String]',
    },
  });
}
