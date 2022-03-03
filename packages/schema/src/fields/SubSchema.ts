/**
 * Used to represent a schema as another schema field
 */

import { FieldType, FieldTypeParser } from '../FieldType';
import type { Schema } from '../Schema';
import type { SchemaDefinitionInput } from '../TSchemaConfig';
import { Infer } from '../TSchemaParser';

export class SubSchemaField<DefinitionInput extends SchemaDefinitionInput> extends FieldType<
  Infer<DefinitionInput>,
  'schema',
  DefinitionInput
> {
  parse: FieldTypeParser<Infer<DefinitionInput>>;

  constructor(def: DefinitionInput) {
    super('schema', def);

    const schema: Schema<DefinitionInput> = require('../Schema').createSchema(def);

    this.parse = this.applyParser({
      parse: (input) => {
        return schema.parse(input);
      },
    });
  }

  static create = <DefinitionInput extends SchemaDefinitionInput>(def: DefinitionInput) => {
    return new SubSchemaField<DefinitionInput>(def);
  };

  graphql = () => ({
    name: 'Unknown',
    sdl: 'scalar Unknown',
  });
}
