import { RuntimeError } from '@darch/utils/lib/RuntimeError';

import { FieldType, TAnyFieldType } from './FieldType';
import { FinalFieldDefinition } from './fields/_parseFields';
import { types } from './fields/fieldTypes';

export function fieldInstanceFromDef(
  definition: FinalFieldDefinition
): TAnyFieldType {
  if (!types[definition.type]) {
    throw new RuntimeError(
      `invalid field definition. types["${definition?.type}"] is undefined`,
      {
        definition,
      }
    );
  }

  const fieldConstructor = types[definition.type] as typeof FieldType;

  let field = fieldConstructor.create(definition.def);

  if (definition.list) {
    field = field.toList();
  }

  if (definition.optional) {
    field = field.toOptional();
  }

  return field;
}
