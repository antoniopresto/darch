import { RuntimeError } from '@darch/utils/lib/RuntimeError';
import { getKeys } from '@darch/utils/lib/getKeys';

import {
  camelCase,
  schemaComposer as defaultSchemaComposer,
  upperFirst,
} from 'graphql-compose';

import { FieldType, TAnyFieldType } from './FieldType';
import { SchemaDefinitionInput } from './TSchemaConfig';
import { fieldTypeConstructors } from './fields/fieldTypes';
import { parseSchemaDefinition } from './parseSchemaDefinition';

import {
  FinalFieldDefinition,
  FinalSchemaDefinition,
} from './fields/_parseFields';

export function schemaToGQL(
  typeName: string,
  definition: SchemaDefinitionInput | FinalSchemaDefinition,
  schemaComposer = defaultSchemaComposer
) {
  const fields: any = {};

  const parsed = parseSchemaDefinition(definition);

  getKeys(parsed).forEach((fieldName) => {
    const field = parsed[fieldName];

    if (field.type === 'schema') {
      const subName = `${parseTypeName(typeName)}${parseTypeName(fieldName)}`;
      const otc = schemaToGQL(subName, field.def as any);
      fields[fieldName] = otc.getTypeName();
    } else {
      fields[fieldName] = fieldToGraphql({
        field,
        parentName: typeName,
        fieldName,
        schemaComposer,
      });
    }
  });

  return schemaComposer.createObjectTC({
    name: typeName,
    fields,
  });
}

export function fieldToGraphql(params: {
  field: FinalFieldDefinition;
  parentName: string;
  fieldName: string;
  schemaComposer?: typeof defaultSchemaComposer;
}) {
  const {
    fieldName,
    field,
    schemaComposer = defaultSchemaComposer,
    parentName,
  } = params;

  function getType() {
    try {
      const def: any = field.def;

      const typeConstructor = fieldTypeConstructors[
        field.type
      ] as typeof FieldType;

      if (!typeConstructor?.create) {
        throw new RuntimeError(
          `Failed to find constructor for field type ${field?.type}`,
          {
            field,
            typeConstructor,
            fieldTypeConstructors,
          }
        );
      }

      const type: TAnyFieldType = typeConstructor.create(def);
      const gqlDef = type.graphql({ fieldName, parentName });

      if (typeof gqlDef === 'string') {
        return gqlDef;
      }

      if (isSDL(gqlDef)) {
        return schemaComposer.createTC(gqlDef.sdl);
      }

      if (hasFields(gqlDef)) {
        return schemaComposer.createObjectTC(gqlDef);
      }
    } catch (err) {
      throw new RuntimeError(`Failed to create type for "${fieldName}".`, {
        err,
        field,
      });
    }

    throw new Error(
      `invalid graphql definition for field "${fieldName}" with type "${field.type}"`
    );
  }

  const type: any = getType();

  const otc = schemaComposer.createObjectTC({
    name: 'temp',
    fields: { temp: type },
  });

  if (field.list) {
    otc.setField('temp', otc.getField('temp').type.getTypePlural());
  }

  if (!field.optional) {
    otc.setField('temp', otc.getField('temp').type.getTypeNonNull());
  }

  return otc.getField('temp');
}

function isSDL(t: any): t is { name: string; sdl: string } {
  return typeof t?.sdl === 'string' && typeof t?.name === 'string';
}

function hasFields(
  t: any
): t is { name: string; fields: Record<string, string> } {
  return typeof t?.fields === 'object' && typeof t?.name === 'string';
}

function parseTypeName(name: string) {
  return upperFirst(camelCase(name));
}
