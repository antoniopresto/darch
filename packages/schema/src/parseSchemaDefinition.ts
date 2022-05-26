import { RuntimeError } from '@darch/utils/lib/RuntimeError';
import { getKeys } from '@darch/utils/lib/getKeys';
import { getTypeName } from '@darch/utils/lib/getTypeName';
import { inspectObject } from '@darch/utils/lib/inspectObject';
import { simpleObjectClone } from '@darch/utils/lib/simpleObjectClone';

import { isFieldInstance, TAnyFieldType } from './FieldType';
import { isSchema, Schema } from './Schema';
import { FieldDefinitionConfig, SchemaDefinitionInput } from './TSchemaConfig';
import { fieldInstanceFromDef } from './fieldInstanceFromDef';

import { types } from './fields/fieldTypes';

import {
  isStringFieldDefinition,
  parseStringDefinition,
} from './parseStringDefinition';

import { FinalFieldDefinition } from './fields/_parseFields';
import { isProduction } from '@darch/utils/lib/env';
import {
  isMetaField,
  MetaField,
  schemaMetaFieldKey,
} from './fields/MetaFieldField';
import { nonNullValues } from '@darch/utils/lib/invariant';

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T
): FinalFieldDefinition;

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T,
  returnInstance: true
): TAnyFieldType;

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T,
  returnInstance = false
) {
  const parsed = simpleObjectClone(parseFieldDefinitionConfig(definition));

  const instanceFromDef = fieldInstanceFromDef(parsed);

  setCachedFieldInstance(parsed, instanceFromDef);

  if (instanceFromDef.def) {
    parsed.def = instanceFromDef.def;
  }

  if (returnInstance) {
    return instanceFromDef;
  }

  if (parsed) return parsed;

  throw new RuntimeError(`field "${fieldName}": invalid definition.`, {
    parsed,
    definition,
  });
}

export function parseFieldDefinitionConfig(
  definition: FieldDefinitionConfig
): FinalFieldDefinition {
  if (isStringFieldDefinition(definition)) {
    return parseStringDefinition(definition);
  }

  if (isFieldInstance(definition)) {
    return definition.toSchemaFieldType();
  }

  if (isFinalFieldDefinition(definition)) {
    if (definition.type === 'schema') {
      if (typeof definition.def !== 'object' || !definition.def) {
        throw new RuntimeError(`Missing def for schema field.`, { definition });
      }

      if (isSchema(definition.def)) {
        definition.def = definition.def.definition;
      } else {
        definition.def = parseSchemaDefinition(definition.def).definition;
      }
    }

    if (definition.type === 'union') {
      let isOptionalUnion = definition.optional;

      definition.def = definition.def.map((el) => {
        const parsed = parseFieldDefinitionConfig(el);
        if (parsed.optional) isOptionalUnion = true;
        return parsed;
      });

      definition.optional = isOptionalUnion;
    }

    return {
      type: definition.type,
      description: definition.description,
      def: definition.def,
      optional: !!definition.optional,
      list: !!definition.list,
    };
  }

  if (isUnionDefArray(definition)) {
    const def = definition.map((el) => parseFieldDefinitionConfig(el));
    const hasOptionalInDef = def.some((el) => el?.optional === true);

    return {
      type: 'union',
      def,
      optional: hasOptionalInDef,
      list: false,
    } as any;
  }

  if (isSchema(definition)) {
    return {
      type: 'schema',
      def: definition.definition,
      optional: false,
      list: false,
      description: definition.description,
    } as any;
  }

  if (isSchemaAsTypeDefinition(definition)) {
    return {
      type: 'schema',
      def: definition.type.definition,
      optional: !!definition.optional,
      list: !!definition.list,
      description: definition.type.description,
    } as any;
  }

  const keyObjectDefinition = parseFlattenFieldDefinition(definition);
  if (keyObjectDefinition) {
    return keyObjectDefinition;
  }

  throw new Error(`Unexpected field definition: ${inspectObject(definition)}`);
}

export function parseSchemaDefinition<T extends SchemaDefinitionInput>(
  input: T,
  options: {
    omitMeta?: boolean;
  } = {}
): {
  definition: { [key: string]: FinalFieldDefinition };
  meta: MetaField['asFinalField'];
} {
  const { omitMeta } = options;

  const result = {} as { [key: string]: FinalFieldDefinition };

  let meta: MetaField['asFinalField'] | undefined = undefined;

  getKeys(input).forEach(function (fieldName) {
    try {
      const item = input[fieldName];

      if (isMetaField(item, fieldName)) {
        return (meta = item);
      }

      return (result[fieldName] = parseSchemaField(
        fieldName,
        (input as any)[fieldName]
      ));
    } catch (err: any) {
      throw new RuntimeError(
        `Failed to process schema field "${fieldName}":\n${err.message}`,
        {
          err,
          input,
        }
      );
    }
  });

  meta = meta || { type: 'meta', def: { id: null } };

  if (!omitMeta) {
    result[schemaMetaFieldKey] = meta;
  }

  return {
    definition: result,
    meta,
  };
}

function isFinalFieldDefinition(input: any): input is FinalFieldDefinition {
  return typeof input?.type === 'string';
}

function isUnionDefArray(input: any): input is [FieldDefinitionConfig[]] {
  if (!Array.isArray(input)) return false;

  if (!isProduction()) {
    // verify against old enum definition
    input.forEach((el) => {
      if (typeof el === 'string' && !isStringFieldDefinition(el)) {
        throw new Error(
          `Plain array is used only for union definitions.\n` +
            `  "${el}" is not valid as union item.\n` +
            `  You can use { enum: ['${el}'] } instead of ['${el}'].`
        );
      }
    });

    if (input.length === 1 && Array.isArray(input[0])) {
      throw new Error(
        `Defining union using one array withing another array (eg: [[type, type2, type3]]) is no more supported .` +
          `  \nInstead, you can use:\n { union: [type1, type2, ...] }.\n`
      );
    }
  }

  return true;
}

/**
 * Schema as field['type'] is deprecated
 * @param input
 */
export function isSchemaAsTypeDefinition(
  input: any
): input is { type: Schema<any>; optional?: boolean; list?: boolean } {
  return input && typeof input === 'object' && isSchema(input.type);
}

const validFlattenDefinitionKeys = {
  description: 'string',
  optional: 'boolean',
  list: 'boolean',
} as const;

export function parseFlattenFieldDefinition(input: any) {
  if (getTypeName(input) !== 'Object') return false;
  if (input.type !== undefined) return false;
  const keys = Object.keys(input);
  if (keys.length > 4) return false;

  let type;
  let def;

  for (let k in input) {
    const val = input[k];

    if (types[k]) {
      type = k;
      def = val;

      if (k !== 'schema' && def && typeof def === 'object') {
        for (let defKey in def) {
          if (defKey === 'def' || validFlattenDefinitionKeys[defKey]) {
            console.warn(`using field def as type definition?\n`, {
              type: k,
              def,
            });
            return false;
          }
        }
      }
    } else {
      if (val !== undefined) {
        if (typeof val !== validFlattenDefinitionKeys[k]) {
          return false;
        }
      }
    }
  }

  let { description, optional, list = false } = input;

  return parseFieldDefinitionConfig({
    type,
    def,
    description,
    optional,
    list,
  });
}

export function __getCachedFieldInstance(field: any): TAnyFieldType {
  return nonNullValues({ __cachedFieldInstance: field?.__cachedFieldInstance })
    .__cachedFieldInstance;
}

function setCachedFieldInstance(field, instanceFromDef: TAnyFieldType) {
  Object.defineProperty(field, '__cachedFieldInstance', {
    value: instanceFromDef,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}
