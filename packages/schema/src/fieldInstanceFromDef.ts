import { RuntimeError } from '@darch/utils/dist/RuntimeError';

import {
  AnyFieldTypeInstance,
  fieldTypeConstructors,
} from './fields/fieldTypes';
import { FinalFieldDefinition } from './fields/_parseFields';

export function fieldInstanceFromDef(
  definition: FinalFieldDefinition
): AnyFieldTypeInstance {
  if (!fieldTypeConstructors.hasOwnProperty(definition.type)) {
    throw new RuntimeError(
      `invalid field definition. fieldTypeConstructors["${definition?.type}"] is undefined`,
      {
        definition,
      }
    );
  }

  let field: AnyFieldTypeInstance = fieldTypeConstructors[
    definition.type
  ].create(definition.def);

  if (definition.list) {
    field = field.toList();
  }

  if (definition.optional) {
    field = field.optional();
  }

  return field;
}
