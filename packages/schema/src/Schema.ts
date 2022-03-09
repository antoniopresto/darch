import { RuntimeError } from '@darch/utils/dist/RuntimeError';
import { StrictMap } from '@darch/utils/dist/StrictMap';
import { expectedType } from '@darch/utils/dist/expectedType';
import { getTypeName } from '@darch/utils/dist/getTypeName';
import { invariantType } from '@darch/utils/dist/invariant';
import { simpleObjectClone } from '@darch/utils/dist/simpleObjectClone';
import { ForceString } from '@darch/utils/dist/typeUtils';

import { SchemaDefinitionInput } from './TSchemaConfig';
import { AnyParsedSchemaDefinition, ParsedSchemaDefinition, Infer } from './TSchemaParser';
import { parseValidationError, ValidationCustomMessage } from './applyValidator';
import { parseSchemaFields } from './getSchemaErrors';
import { parseSchemaDefinition } from './parseSchemaDefinition';

export * from './schemaInferenceUtils';

export class Schema<DefinitionInput extends SchemaDefinitionInput> {
  _infer!: Infer<DefinitionInput>;

  private readonly __definition: any;

  get definition(): ParsedSchemaDefinition<DefinitionInput> {
    return this.__definition;
  }

  _description = '';

  constructor(schemaDef: DefinitionInput) {
    this.__definition = parseSchemaDefinition(schemaDef);
  }

  parse(
    input: any,
    options?: { partial?: boolean; customMessage?: ValidationCustomMessage }
  ): Infer<DefinitionInput> {
    const { customMessage } = options || {};
    const { errors, parsed } = this.safeParse(input, options?.partial);

    if (errors.length) {
      const err: any = parseValidationError(input, customMessage, errors.join(' \n'));
      err.isSchemaValidationError = true;
      err.fieldErrors = errors;
      throw err;
    }

    return parsed as any;
  }

  validate(input: any): input is Infer<DefinitionInput> {
    try {
      this.parse(input);
      return true;
    } catch (e) {
      return false;
    }
  }

  safeParse(input: any, partial?: boolean): { errors: string[]; parsed: unknown } {
    const SchemaConstructor: any = this.constructor;

    const errors: string[] = [];
    const parsed: any = {};

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new RuntimeError(`Invalid input. Expected object, found ${getTypeName(input)}`, {
        input,
      });
    }

    Object.keys(this.definition).forEach((currField) => {
      const value = input[currField];
      const definition = this.definition[currField];

      if (value === undefined && partial) {
        return;
      }

      const result = parseSchemaFields({
        createSchema: (def) => new SchemaConstructor(def),
        fieldName: currField,
        definition,
        value,
      });

      parsed[currField] = result.parsed;
      errors.push(...result.errors);
    });

    return { parsed, errors };
  }

  describe(...descriptions: [comment: string] | [{ [K in keyof DefinitionInput]?: string }]): this {
    if (descriptions.length === 1 && typeof descriptions[0] === 'string') {
      this._description = descriptions[0];
      return this;
    }

    const commentsConfig = descriptions[0];

    invariantType({ commentsConfig }, 'object', { commentsConfig });

    const definition: AnyParsedSchemaDefinition = this.definition as any;

    Object.entries(commentsConfig).forEach(([name, comment]) => {
      invariantType({ [name]: definition[name] }, 'object', `"${name}" is not in schema definition.`);
      definition[name].description = comment || '';
    });

    return this;
  }

  removeField<K extends ForceString<keyof DefinitionInput>>(field: K | K[]): Schema<OmitDefinitionFields<this, K>> {
    const fields: string[] = Array.isArray(field) ? field : [field];
    const clone = this.clone();

    for (const k in clone.__definition) {
      if (fields.includes(k)) {
        delete clone.__definition[k];
      }
    }

    return clone as any;
  }

  addFields<T extends SchemaDefinitionInput>(definition: T): Schema<ExtendDefinition<this, T>> {
    return this.clone(definition) as any;
  }

  get __isTaskforceSchema() {
    return true;
  }

  clone(): this;
  clone<T extends SchemaDefinitionInput>(extend: T): ExtendDefinition<this, T>;
  clone(...args: any[]) {
    const def = simpleObjectClone({ ...this.definition, ...args[0] });
    return createSchema(def) as any;
  }

  private __id: string | null = null;
  get id() {
    return this.__id;
  }

  identify<ID extends string>(id: ID): this & { id: ID } {
    if (this.id) {
      throw new Error(
        `Trying to replace existing id "${this.id}" with "${id}". You can clone it to create a new Schema.`
      );
    }

    expectedType({ id }, 'string', 'truthy');

    if (Schema.register.has(id)) {
      throw new Error(`Schema with id "${id}" already registered.`);
    }

    this.__id = id;
    Schema.register.set(id, this);

    return this as any;
  }

  static register = new StrictMap();
}

export const DarchSchema = Schema;

export function createSchema<DefinitionInput extends Readonly<SchemaDefinitionInput>>(
  fields: DefinitionInput
): Schema<DefinitionInput> {
  return new Schema<DefinitionInput>(fields);
}

type OmitDefinitionFields<T, Keys extends string> = T extends { definition: Record<string, any> }
  ? Omit<T['definition'], Keys>
  : never;

type ExtendDefinition<T, Ext extends SchemaDefinitionInput> = T extends { definition: Record<string, any> }
  ? {
      [K in keyof (T['definition'] & Ext)]: (T['definition'] & Ext)[K];
    }
  : never;
