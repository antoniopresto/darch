import type { Schema } from './Schema';
import { types, isFieldTypeName } from './fields/fieldTypes';

export function parseSchemaFields(params: {
  createSchema: (def: any) => { getErrors: Function; parse: Function };
  parentType?: string;
  fieldName: string;
  definition: any;
  value: any;
}): {
  errors: string[];
  parsed?: any;
} {
  const { fieldName, definition, value, parentType, createSchema } = params;

  function prefixError(msg: string) {
    return parentType ? `• ${parentType}[${fieldName}] ${msg}` : `➤ field "${fieldName}": ${msg.replace(/\.$/, '')}.`;
  }

  if (value === undefined) {
    if (definition.optional) {
      return {
        errors: [],
      };
    } else {
      if (definition.type === 'union') {
        return {
          errors: [
            prefixError(
              `expected value to match one of the following types: ${definition.def.map((el) => el.type).join(' or ')}`
            ),
          ],
        };
      }

      return {
        errors: [prefixError(`expected type ${definition.type}, found undefined`)],
      };
    }
  }

  if (definition.list) {
    if (!Array.isArray(value)) {
      return {
        errors: [prefixError(`expected array, found ${typeof value}`)],
      };
    }

    const parsed: any[] = [];
    const errors: string[] = [];

    value.forEach(function (item, key) {
      const result = parseSchemaFields({
        createSchema,
        fieldName: key + '',
        parentType: fieldName,
        definition: {
          ...definition,
          list: false,
        },
        value: item,
      });
      parsed.push(result.parsed);
      errors.push(...result.errors);
    });

    return { parsed, errors };
  }

  if (definition.type === 'schema') {
    const def = definition.def;

    if (typeof value !== 'object') {
      return {
        errors: [prefixError(`expected object, found ${typeof value}`)],
      };
    }

    const schema: Schema<any> = createSchema(def) as any;
    const result = schema.safeParse(value);

    return {
      parsed: result.parsed,
      errors: result.errors.map((e) => prefixError(e)),
    };
  }

  try {
    if (!isFieldTypeName(definition.type)) {
      throw new Error(`${definition.type} is not a valid type`);
    }

    const Constructor = types[definition.type];
    const fieldInstance = Constructor.create(definition.def);
    return {
      parsed: fieldInstance.parse(value),
      errors: [],
    };
  } catch (e: any) {
    return {
      errors: [prefixError(`${e.message}`)],
    };
  }
}
