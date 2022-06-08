import { RuntimeError } from '@darch/utils/lib/RuntimeError';
import { StrictMap } from '@darch/utils/lib/StrictMap';
import { dynamicRequire } from '@darch/utils/lib/dynamicRequire';
import { isProduction } from '@darch/utils/lib/env';
import { expectedType } from '@darch/utils/lib/expectedType';
import { getTypeName } from '@darch/utils/lib/getTypeName';
import { invariantType } from '@darch/utils/lib/invariant';
import { isBrowser } from '@darch/utils/lib/isBrowser';
import { simpleObjectClone } from '@darch/utils/lib/simpleObjectClone';
import { ForceString } from '@darch/utils/lib/typeUtils';
import type {
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';

import type { DarchType } from './DarchType';
import type { ParseTypeOptions } from './GraphQLParser/GraphQLParser';
import type { ParseInterfaceOptions } from './GraphQLParser/GraphQLParser';
import type { Infer } from './Infer';
import type { ObjectDefinitionInput } from './TObjectConfig';
import {
  parseValidationError,
  ValidationCustomMessage,
} from './applyValidator';
import { assertSameDefinition } from './assertSameDefinition';
import {
  getObjectDefinitionMetaField,
  isMetaFieldKey,
  MetaFieldDef,
  objectMetaFieldKey,
  Serializable,
} from './fields/MetaFieldField';
import type {
  FinalObjectDefinition,
  ObjectFieldInput,
  ParseFields,
  ToFinalField,
} from './fields/_parseFields';
import { validateObjectFields } from './getObjectErrors';
import { getObjectHelpers, ObjectHelpers } from './getObjectHelpers';
import type { ObjectToTypescriptOptions } from './objectToTypescript';
import { parseObjectDefinition } from './parseObjectDefinition';
import { withCache, WithCache } from './withCache';

export { RuntimeError } from '@darch/utils/lib/RuntimeError';
export * from './parseObjectDefinition';
export * from './objectInferenceUtils';
export * from './implementObject';

export class ObjectType<DefinitionInput extends ObjectDefinitionInput> {
  private readonly __definition: any;

  __withCache: WithCache<{
    graphqlInputType: GraphQLInputObjectType;
    graphqlType: GraphQLObjectType;
    graphqlInterfaceType: GraphQLInterfaceType;
    helpers: ObjectHelpers<DefinitionInput>;
  }>;

  constructor(objectDef: DefinitionInput) {
    const parsed = parseObjectDefinition(objectDef);
    this.__definition = parsed.definition;
    this.__withCache = withCache(this);
  }

  get definition(): ParseFields<DefinitionInput> {
    return this.__definition;
  }

  get description() {
    return this.meta.description;
  }

  get meta(): MetaFieldDef {
    return this.__definition[objectMetaFieldKey].def;
  }

  __setMetaData(k: keyof MetaFieldDef, value: Serializable) {
    this.__definition[objectMetaFieldKey].def[k] = value;
  }

  parse(
    input: any,
    options?: {
      customMessage?: ValidationCustomMessage;
    }
  ): Infer<DefinitionInput>;

  parse(
    input: any,
    options?: {
      partial: true;
      customMessage?: ValidationCustomMessage;
    }
  ): Partial<Infer<DefinitionInput>>;

  parse<Fields extends (keyof DefinitionInput)[]>(
    input: any,
    options: {
      customMessage?: ValidationCustomMessage;
      fields: Fields;
    }
  ): {
    [K in keyof Infer<DefinitionInput> as K extends Fields[number]
      ? K
      : never]: Infer<DefinitionInput>[K];
  };

  parse(input: any, options?: any) {
    const { customMessage } = options || {};
    const { errors, parsed } = this.safeParse(input, options);

    if (errors.length) {
      const err: any = parseValidationError(
        input,
        customMessage,
        errors.join(' \n')
      );
      err.isObjectValidationError = true;
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

  safeParse(
    input: any,
    options?: {
      partial?: boolean;
      customMessage?: ValidationCustomMessage;
      fields?: keyof DefinitionInput[];
    }
  ): { errors: string[]; parsed: unknown } {
    const { partial = false, fields = Object.keys(this.definition) } =
      options || {};

    const ObjectConstructor: any = this.constructor;

    const errors: string[] = [];
    const parsed: any = {};

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new RuntimeError(
        `Invalid input. Expected object, found ${getTypeName(input)}`,
        {
          input,
        }
      );
    }

    (fields as string[]).forEach((currField) => {
      if (isMetaFieldKey(currField)) return;

      const value = input[currField];

      const fieldDef = this.definition[currField];

      if (value === undefined && partial) {
        return;
      }

      const result = validateObjectFields({
        createObjectType: (def) => new ObjectConstructor(def),
        fieldName: currField,
        definition: fieldDef,
        value,
      });

      if (Object.prototype.hasOwnProperty.call(input, currField)) {
        parsed[currField] = result.parsed;
      }

      errors.push(...result.errors);
    });

    return { parsed, errors };
  }

  describe(
    ...descriptions:
      | [comment: string]
      | [{ [K in keyof DefinitionInput]?: string }]
  ): ObjectType<DefinitionInput> {
    if (descriptions.length === 1 && typeof descriptions[0] === 'string') {
      this.__setMetaData('description', descriptions[0]);
      return this;
    }

    const commentsConfig = descriptions[0];

    invariantType({ commentsConfig }, 'object', { commentsConfig });

    const definition: FinalObjectDefinition = this.definition as any;

    Object.entries(commentsConfig).forEach(([name, comment]) => {
      invariantType(
        { [name]: definition[name] },
        'object',
        `"${name}" is not in object definition.`
      );
      definition[name].description = comment || '';
    });

    return this;
  }

  removeField<K extends ForceString<keyof DefinitionInput>>(
    field: K | K[]
  ): OmitDefinitionFields<DefinitionInput, K> {
    const fields: string[] = Array.isArray(field) ? field : [field];
    const clone = this.clone();

    for (const k in clone.__definition) {
      if (fields.includes(k)) {
        delete clone.__definition[k];
      }
    }

    return clone as any;
  }

  addFields<T extends ObjectDefinitionInput>(
    definition: T
  ): ObjectExtendDefinition<ParseFields<DefinitionInput>, T> {
    return this.clone(definition) as any;
  }

  makeOptional<K extends ForceString<keyof DefinitionInput>>(
    fields: K | K[]
  ): ObjectType<MakeOptional<DefinitionInput, K>> {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    const clone = this.clone();
    fieldList.forEach((key) => (clone.__definition[key].optional = true));
    return clone as any;
  }

  makeRequired<K extends ForceString<keyof DefinitionInput>>(
    fields: K | K[]
  ): ObjectType<MakeRequired<DefinitionInput, K>> {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    const clone = this.clone();
    fieldList.forEach((key) => (clone.__definition[key].optional = false));
    return clone as any;
  }

  get __isDarchObject(): true {
    return true;
  }

  clone(name?: string): this;

  clone<T extends ObjectDefinitionInput>(
    extend: T,
    name?: string
  ): ObjectExtendDefinition<ParseFields<DefinitionInput>, T>;

  clone<T extends Record<string, ObjectFieldInput | null>>(
    extend: (current: ParseFields<DefinitionInput>) => T,
    name?: string
  ): ObjectType<{ [K in keyof ExcludeNull<T>]: ExcludeNull<T>[K] }>;

  clone<K extends keyof DefinitionInput>(
    fields: K[],
    name?: string
  ): ObjectType<CloneFields<ParseFields<DefinitionInput>, K>>;

  clone<
    K extends keyof DefinitionInput,
    T extends Record<string, ObjectFieldInput | null>
  >(
    fields: K[],
    extend: (current: CloneFields<ParseFields<DefinitionInput>, K>) => T,
    name?: string
  ): ObjectType<{ [K in keyof ExcludeNull<T>]: ExcludeNull<T>[K] }>;

  clone(...args: any[]) {
    const lastArg = args[args.length - 1];

    let newId;
    if (typeof lastArg === 'string') {
      newId = args.pop();
    }

    const definitionClone = simpleObjectClone(this.definition);
    delete definitionClone[objectMetaFieldKey];

    let extend;
    let fields;

    if (args.length === 1) {
      if (Array.isArray(args[0])) {
        fields = args[0];
      } else {
        extend = args[0];
      }
    }

    if (args.length === 2) {
      fields = args[0];
      extend = args[1];
    }

    if (Array.isArray(fields)) {
      for (const k in definitionClone) {
        if (!fields.includes(k)) {
          delete definitionClone[k];
        }
      }
    }

    const def =
      typeof extend === 'function'
        ? extend(definitionClone)
        : typeof extend === 'object'
        ? { ...definitionClone, ...extend }
        : definitionClone;

    Object.keys(def).forEach((k) => {
      if (!def[k]) {
        delete def[k];
      }
    });

    const object = createObjectType(def);

    if (newId) {
      object.identify(newId);
    }

    return object as any;
  }

  get id() {
    return this.meta.id;
  }

  get nonNullId() {
    const id = this.meta.id!;
    if (!id) {
      throw new RuntimeError('Expected object to be identified.', {
        definition: this.definition,
      });
    }
    return id;
  }

  identify<ID extends string>(id: ID): this & { id: ID } {
    if (id && id === this.id) return this as any;

    if (this.id) {
      throw new Error(
        `Trying to replace existing id "${this.id}" with "${id}". You can clone it to create a new Object.`
      );
    }

    expectedType({ id }, 'string', 'truthy');

    if (ObjectType.register.has(id) && ObjectType.register.get(id) !== this) {
      console.error(`Object with id "${id}" already registered.`);
    }

    this.__setMetaData('id', id);
    ObjectType.register.set(id, this);

    return this as any;
  }

  helpers = () => {
    return this.__withCache('helpers', () => getObjectHelpers(this));
  };

  toGraphQL = (name?: string) => {
    if (isBrowser() || typeof module?.require !== 'function') {
      throw new Error('GraphQL transformation is not available in browser.');
    }

    if (name) {
      this.identify(name);
    }

    if (!this.id) {
      throw new RuntimeError(
        'Should object.identify() before converting to Graphql.' +
          '\nYou can call object.clone() to choose a different identification.',
        { 'used definition': this.definition }
      );
    }

    const { GraphQLParser } = ObjectType.serverUtils().graphqlParser;

    return GraphQLParser.objectToGraphQL({
      object: this,
    });
  };

  graphqlType = (options?: ParseTypeOptions): GraphQLObjectType => {
    return this.__withCache('graphqlType', () =>
      this.toGraphQL().getType(options)
    );
  };

  graphqlInterfaceType = (
    options?: ParseInterfaceOptions
  ): GraphQLInterfaceType => {
    return this.__withCache('graphqlInterfaceType', () =>
      this.toGraphQL().interfaceType(options)
    );
  };

  graphqlPrint = (): string => {
    return this.toGraphQL().typeToString();
  };

  typescriptPrint = (options?: ObjectToTypescriptOptions): Promise<string> => {
    return ObjectType.serverUtils().objectToTypescript.objectToTypescript(
      this.nonNullId,
      this,
      options
    );
  };

  graphqlTypeToString = (): string => {
    return this.toGraphQL().typeToString();
  };

  graphqlInputType = (options?: ParseTypeOptions) => {
    return this.__withCache('graphqlInputType', () =>
      this.toGraphQL().getInputType(options)
    );
  };

  static serverUtils() {
    if (isBrowser() || typeof module?.require !== 'function') {
      throw new Error('Server utils are not available on browser.');
    }

    return {
      graphql: dynamicRequire('graphql', module) as typeof import('graphql'),

      graphqlParser: dynamicRequire(
        './GraphQLParser/GraphQLParser',
        module
      ) as typeof import('./GraphQLParser/GraphQLParser'),

      DarchType: dynamicRequire(
        './DarchType',
        module
      ) as typeof import('./DarchType'),

      objectToTypescript: dynamicRequire(
        './objectToTypescript',
        module
      ) as typeof import('./objectToTypescript'),
    };
  }

  static async reset() {
    if (typeof window === 'undefined') {
      const { graphqlParser, DarchType } = ObjectType.serverUtils();
      graphqlParser.GraphQLParser.reset();
      DarchType.DarchType.reset();
    }

    ObjectType.register.clear();
  }

  static register = new StrictMap<string, any>();

  /**
   * Get an Object with the provided id
   *    or set a new Object in the register if not found.
   * @param id
   * @param def
   */
  static getOrSet = <T extends ObjectDefinitionInput>(
    id: string,
    def: T
  ): ObjectType<T> => {
    const existing =
      ObjectType.register.has(id) &&
      (ObjectType.register.get(id) as ObjectType<T>);

    if (existing) {
      !isProduction() && assertSameDefinition(id, def, existing.definition);
      return existing;
    }

    return new ObjectType<T>(def).identify(id);
  };

  static createType<Definition extends ObjectFieldInput>(
    definition: Definition
  ): DarchType<Definition>;

  static createType<Definition extends ObjectFieldInput>(
    name: string,
    definition: Definition
  ): DarchType<Definition>;

  static createType(...args: any) {
    return ObjectType.serverUtils().DarchType.createType(
      // @ts-ignore
      ...args
    );
  }
}

export const DarchObject = ObjectType;

export function createObjectType<
  DefinitionInput extends Readonly<ObjectDefinitionInput>
>(fields: Readonly<DefinitionInput>): ObjectType<DefinitionInput>;

export function createObjectType<
  DefinitionInput extends Readonly<ObjectDefinitionInput>
>(name: string, fields: DefinitionInput): ObjectType<DefinitionInput>;

export function createObjectType<
  DefinitionInput extends Readonly<ObjectDefinitionInput>
>(
  ...args: [string, DefinitionInput] | [DefinitionInput]
): ObjectType<DefinitionInput> {
  const fields = args.length === 2 ? args[1] : args[0];

  const id = args.length === 2 ? args[0] : undefined;
  if (id) return ObjectType.getOrSet(id, fields);

  const idFromDefinition = getObjectDefinitionMetaField(fields)?.def?.id;
  if (idFromDefinition) return ObjectType.getOrSet(idFromDefinition, fields);

  return new ObjectType<DefinitionInput>(fields);
}

export { createObjectType as createDarchObject };

type OmitDefinitionFields<T, Keys extends string> = T extends {
  [K: string]: any;
}
  ? ObjectType<{ [K in keyof T as K extends Keys ? never : K]: T[K] }>
  : never;

type ObjectExtendDefinition<T, Ext> = T extends { [K: string]: any }
  ? Ext extends { [K: string]: any }
    ? ObjectType<{
        [K in keyof (T & Ext)]: (T & Ext)[K];
      }>
    : never
  : never;

type CloneFields<T, Keys> = T extends {
  [K: string]: any;
}
  ? { [K in keyof T as K extends Keys ? K : never]: T[K] }
  : never;

type MakeOptional<T, Keys extends string> = T extends {
  [K: string]: any;
}
  ? {
      [K in keyof T]: K extends Keys
        ? ToFinalField<T[K]> extends infer Obj
          ? { [K in keyof Obj]: K extends 'optional' ? true : Obj[K] }
          : never
        : T[K];
    }
  : never;

type MakeRequired<T, Keys extends string> = T extends {
  [K: string]: any;
}
  ? {
      [K in keyof T]: K extends Keys
        ? ToFinalField<T[K]> extends infer Obj
          ? { [K in keyof Obj]: K extends 'optional' ? false : Obj[K] }
          : never
        : T[K];
    }
  : never;

type ExcludeNull<T> = {
  [K in keyof T as [T[K]] extends [null]
    ? never
    : [T[K]] extends [undefined]
    ? never
    : K]: Exclude<T[K], null>;
};
