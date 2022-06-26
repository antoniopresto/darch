import { RuntimeError } from '@darch/utils/lib/RuntimeError';
import { StrictMap } from '@darch/utils/lib/StrictMap';
import { assertSame } from '@darch/utils/lib/assertSame';
import { isProduction } from '@darch/utils/lib/env';
import { Merge } from '@darch/utils/lib/typeUtils';
import type {
  GraphQLInterfaceType,
  GraphQLNamedInputType,
  GraphQLNamedType,
} from 'graphql';

import { Infer } from '../Infer';
import { createObjectType, ObjectType } from '../ObjectType';
import { FieldDefinitionConfig } from '../TObjectConfig';
import { TAnyFieldType, ValidationCustomMessage } from '../fields/FieldType';
import { GraphTypeLike } from '../fields/IObjectLike';
import { getObjectDefinitionId } from '../fields/MetaFieldField';
import { ObjectField } from '../fields/ObjectField';
import {
  ObjectDefinitionInput,
  ObjectFieldInput,
  ToFinalField,
} from '../fields/_parseFields';
import type { ObjectToTypescriptOptions } from '../objectToTypescript';
import { parseObjectField } from '../parseObjectDefinition';

import type { ConvertFieldResult, GraphQLParserResult } from './GraphQLParser';
import {
  AnyResolver,
  createResolver,
  Resolver,
  ResolverConfig,
} from './createResolver';

export class GraphType<Definition> implements GraphTypeLike {
  static __isGraphType = true;
  readonly __isGraphType = true;

  static register = new StrictMap<string, GraphTypeLike>();
  static resolvers = new StrictMap<string, AnyResolver>();

  static reset = async () => {
    this.resolvers.clear();
    this.register.clear();
  };

  readonly definition: ToFinalField<Definition>;
  readonly definitionInput: FieldDefinitionConfig;

  __field: TAnyFieldType;

  readonly id: string;
  readonly _object: ObjectType<any> | undefined;

  constructor(
    definition: Definition extends ObjectFieldInput ? Definition : never
  );

  constructor(
    name: string,
    definition: Definition extends ObjectFieldInput ? Definition : never
  );

  constructor(...args: any[]) {
    let name: string | undefined = undefined;
    let definition: ObjectFieldInput;

    if (args.length === 2) {
      name = args[0];
      definition = args[1];
    } else {
      definition = args[0];
    }

    this.__field = parseObjectField('temp', definition, true);

    if (ObjectField.is(this.__field)) {
      if (
        name &&
        this.__field.utils.object.id &&
        this.__field.utils.object.id !== name
      ) {
        this.__field.utils.object = this.__field.utils.object.clone(name);
      } else if (name) {
        this.__field.utils.object.identify(name);
      } else {
        name = getObjectDefinitionId(this.__field.utils.object.definition);
      }

      this._object = this.__field.utils.object;
    }

    if (!name) {
      throw new RuntimeError(`Expected name to be provided, found ${name}`, {
        name,
        definition,
      });
    }

    this.id = name;

    this.definition = this.__field.asFinalFieldDef as any;

    if (GraphType.register.has(name)) {
      const existing = GraphType.register.get(name);

      if (!isProduction()) {
        assertSame(
          `Different type already registered with name "${name}"`,
          this.definition,
          existing.definition
        );
      }
    } else {
      GraphType.register.set(name, this as any);
    }
  }

  parse = (
    input: any,
    customMessage?: ValidationCustomMessage
  ): Infer<ToFinalField<Definition>> => {
    return this.__field.parse(input, customMessage);
  };

  _toGraphQL = () => {
    return ObjectType.serverUtils().graphqlParser.GraphQLParser.fieldToGraphQL({
      field: this.__field,
      path: [`Type_${this.id}`],
      plainField: this.__field.asFinalFieldDef,
      fieldName: this.id,
      parentName: this.id,
    });
  };

  graphQLType = (
    ...args: Parameters<ConvertFieldResult['type']>
  ): GraphQLNamedType => {
    return this._toGraphQL().type(...args) as any;
  };

  graphQLInputType = (
    ...args: Parameters<ConvertFieldResult['inputType']>
  ): GraphQLNamedInputType => {
    return this._toGraphQL().inputType(...args) as any;
  };

  graphQLInterface = (
    ...args: Parameters<GraphQLParserResult['interfaceType']>
  ): GraphQLInterfaceType => {
    if (!this._object) {
      throw new RuntimeError(
        'graphQLInterface is only available for object type',
        {
          type: this.__field.type,
        }
      );
    }

    return ObjectType.serverUtils()
      .graphqlParser.GraphQLParser.objectToGraphQL({
        object: this._object,
      })
      .interfaceType(...args);
  };

  relations = {};

  addRelation = <
    FieldTypeDef extends ObjectFieldInput,
    Name extends string,
    Context = unknown,
    ArgsDef extends ObjectDefinitionInput = ObjectDefinitionInput
  >(
    options: Merge<
      { type: FieldTypeDef; name: Name },
      ResolverConfig<
        Context,
        Infer<ToFinalField<Definition>>,
        FieldTypeDef,
        ArgsDef
      >
    >
  ): this => {
    const object = this._object;

    const type = createType(options.name, options.type);

    const { name } = options;

    if (!object) {
      throw new RuntimeError(`Can't add relation to a not object type`, {
        object,
        type,
        options,
      });
    }

    const allOptions = {
      type,
      ...(options as any),
    };

    const resolver = createResolver(allOptions);

    // registering relations to be added when creating graphql schema
    resolver.__isRelation = true;
    resolver.__relatedToGraphTypeId = this.id;
    object.addGraphQLMiddleware((hooks) => {
      hooks.onFieldConfigMap.register(function (fields) {
        fields[name] = resolver;
      });
    });

    return this;
  };

  print = (): string[] => {
    const type = this.graphQLType();
    const inputType = this.graphQLInputType();

    const { GraphQLSchema, printSchema } = ObjectType.serverUtils().graphql;

    const object = new GraphQLSchema({
      // @ts-ignore
      types: [type, inputType],
    });

    return printSchema(object).split('\n');
  };

  typescriptPrint = (
    options?: ObjectToTypescriptOptions & { name?: string }
  ) => {
    const object =
      this._object ||
      createObjectType({
        [this.id]: this.definition,
      });

    return ObjectType.serverUtils().objectToTypescript.objectToTypescript(
      options?.name || this.id,
      object,
      options
    );
  };

  createResolver = <
    ArgsDef extends ObjectDefinitionInput | Readonly<ObjectDefinitionInput>
  >(
    options: Readonly<
      Omit<ResolverConfig<any, any, Definition, ArgsDef>, 'type'>
    >
  ): Resolver<any, any, Definition, ArgsDef> => {
    return createResolver({
      type: this,
      ...options,
    } as any);
  };

  /**
   * Get an Object with the provided id
   *    or set a new Object in the register if not found.
   * @param id
   * @param def
   */
  static getOrSet = <T extends FieldDefinitionConfig>(
    id: string,
    def: T
  ): GraphType<T> => {
    const existing =
      GraphType.register.has(id) &&
      (GraphType.register.get(id) as GraphType<T>);

    if (existing) return existing;

    return new GraphType<any>(id, def) as any;
  };

  static is(input: any): input is GraphType<any> {
    return input?.__isGraphType === true;
  }

  static isTypeDefinition(
    input: any
  ): input is { type: GraphTypeLike; list?: boolean; optional?: boolean } {
    return input?.type?.__isGraphType === true;
  }
}

export function createType<Definition extends ObjectFieldInput>(
  definition: Definition
): GraphType<Definition>;

export function createType<Definition extends ObjectFieldInput>(
  name: string,
  definition: Definition
): GraphType<Definition>;

export function createType(...args: any[]) {
  return new GraphType(
    // @ts-ignore
    ...args
  );
}
