import { RuntimeError } from '@darch/utils/dist/RuntimeError';
import { getKeys } from '@darch/utils/dist/getKeys';
import { getTypeName } from '@darch/utils/dist/getTypeName';
import { inspectObject } from '@darch/utils/dist/inspectObject';
import { simpleObjectClone } from '@darch/utils/dist/simpleObjectClone';

import { isFieldType } from './FieldType';
import { isSchema, Schema } from './Schema';
import { FieldDefinitionConfig } from './TSchemaConfig';
import { ParsedFieldDefinition, ParsedSchemaDefinition } from './TSchemaParser';
import { fieldInstanceFromDef } from './fieldInstanceFromDef';
import {
  AnyFieldTypeInstance,
  fieldTypeConstructors,
} from './fields/fieldTypes';
import {
  isStringFieldDefinition,
  parseStringDefinition,
} from './parseStringDefinition';
import { FinalFieldDefinition } from './fields/_parseFields';

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T
): ParsedFieldDefinition<T>;

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T,
  returnInstance: true
): AnyFieldTypeInstance | null;

export function parseSchemaField<T extends FieldDefinitionConfig>(
  fieldName: string,
  definition: T,
  returnInstance = false
) {
  const parsed = simpleObjectClone(parseFieldDefinitionConfig(definition));

  const instanceFromDef = fieldInstanceFromDef(parsed);

  if (instanceFromDef.def) {
    parsed.def = instanceFromDef.def;
  }

  if (returnInstance) {
    if (parsed) return instanceFromDef;
    return null;
  }

  if (parsed) return parsed;

  throw new RuntimeError(`field "${fieldName}": invalid definition.`, {
    parsed,
    definition,
  });
}

export function parseFieldDefinitionConfig(
  definition: FieldDefinitionConfig
): ParsedFieldDefinition<any> {
  if (isSchemaLiteral(definition)) {
    const { schema, description, optional = false, list = false } = definition;

    const def: any = parseSchemaDefinition(schema);

    return {
      type: 'schema',
      def,
      description,
      optional,
      list,
    };
  }

  if (isFinalFieldDefinition(definition)) {
    if (definition.type === 'schema') {
      if (typeof definition.def !== 'object' || !definition.def) {
        throw new RuntimeError(`Missing def for schema field.`, { definition });
      }
      if (isSchema(definition.def)) {
        throw new RuntimeError(`Def should be a schema.def, not a schema.`, {
          definition,
        });
      }
    }

    if (definition.type === 'union') {
      definition.def = definition.def.map((el) =>
        parseFieldDefinitionConfig(el)
      );
    }

    return {
      ...(definition as any),
      optional: !!definition.optional,
      list: !!definition.list,
    };
  }

  if (isStringFieldDefinition(definition)) {
    return parseStringDefinition(definition);
  }

  if (isStringArray(definition)) {
    return {
      type: 'enum',
      def: definition,
      optional: false,
      list: false,
    } as any;
  }

  if (isUnionDefArray(definition)) {
    const def = definition[0].map((el) => parseFieldDefinitionConfig(el));
    const hasOptionalInDef = def.some((el) => el?.optional === true);

    return {
      type: 'union',
      def,
      optional: hasOptionalInDef,
      list: false,
    } as any;
  }

  if (isFieldType(definition)) {
    return {
      type: definition.typeName,
      def: definition.def,
      optional: !!definition.isOptional,
      list: !!definition.isList,
    } as any;
  }

  if (isSchema(definition)) {
    return {
      type: 'schema',
      def: definition.definition,
      optional: false,
      list: false,
    } as any;
  }

  if (isSchemaAsTypeDefinition(definition)) {
    return {
      type: 'schema',
      def: definition.type.definition,
      optional: !!definition.optional,
      list: !!definition.list,
    } as any;
  }

  const keyObjectDefinition = parseSingleKeyObjectDefinition(definition);
  if (keyObjectDefinition) {
    return keyObjectDefinition;
  }

  throw new Error(`Unexpected field definition: ${inspectObject(definition)}`);
}

export function parseSchemaDefinition<T>(input: T): ParsedSchemaDefinition<T> {
  const result = {} as ParsedSchemaDefinition<T>;

  getKeys(input).forEach(function (fieldName) {
    try {
      (result as any)[fieldName] = parseSchemaField(
        fieldName,
        (input as any)[fieldName]
      );
    } catch (err) {
      throw new RuntimeError(`failed to process schema`, {
        err,
        input,
        fieldName,
      });
    }
  });

  return result;
}

function isFinalFieldDefinition(input: any): input is FinalFieldDefinition {
  return typeof input?.type === 'string';
}

function isStringArray<T extends string>(input: any): input is T[] {
  return Array.isArray(input) && !input.some((el) => typeof el !== 'string');
}

function isUnionDefArray(input: any): input is [FieldDefinitionConfig[]] {
  return Array.isArray(input) && input[0] !== 'string';
}

export function isSchemaAsTypeDefinition(
  input: any
): input is { type: Schema<any>; optional?: boolean; list?: boolean } {
  return input && typeof input === 'object' && isSchema(input.type);
}

function isSchemaLiteral(input: any): input is {
  schema: any;
  optional?: boolean;
  list?: boolean;
  description?: string;
} {
  return Boolean(
    !input?.type &&
      input?.schema &&
      typeof input.schema === 'object' &&
      !isFieldType(input)
  );
}

const validTypes = {
  description: 'string',
  optional: 'boolean',
  list: 'boolean',
} as const;

export function parseSingleKeyObjectDefinition(input: any) {
  if (getTypeName(input) !== 'Object') return false;
  if (input.type !== undefined) return false;
  const keys = Object.keys(input);
  if (keys.length > 4) return false;

  let type;
  let def;

  for (let k in input) {
    const val = input[k];

    if (fieldTypeConstructors[k]) {
      type = k;
      def = val;

      if (k !== 'schema' && def && typeof def === 'object') {
        for (let defKey in def) {
          if (defKey === 'def' || validTypes[defKey]) {
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
        if (typeof val !== validTypes[k]) {
          return false;
        }
      }
    }
  }

  let { description = '', optional = false, list = false } = input;

  if (type === 'union') {
    def = def.map((el) => parseFieldDefinitionConfig(el));
    const hasOptionalInDef = def.some((el) => el?.optional === true);
    if (hasOptionalInDef) {
      optional = true;
    }
  }

  return parseFieldDefinitionConfig({
    type,
    def,
    description,
    optional,
    list,
  } as any);
}
