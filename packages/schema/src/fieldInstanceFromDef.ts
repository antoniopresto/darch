import { RuntimeError } from '@darch/utils/lib/RuntimeError';

import { fieldTypeConstructors } from './fields/fieldTypes';
import { FinalFieldDefinition } from './fields/_parseFields';
import { FieldType, TAnyFieldType } from './FieldType';

export function fieldInstanceFromDef(
  definition: FinalFieldDefinition
): TAnyFieldType {
  if (!fieldTypeConstructors[definition.type]) {
    throw new RuntimeError(
      `invalid field definition. fieldTypeConstructors["${definition?.type}"] is undefined`,
      {
        definition,
      }
    );
  }

  const fieldConstructor = fieldTypeConstructors[
    definition.type
  ] as typeof FieldType;

  let field = fieldConstructor.create(definition.def);

  if (definition.list) {
    field = field.toList();
  }

  if (definition.optional) {
    field = field.toOptional();
  }

  return field;
}
