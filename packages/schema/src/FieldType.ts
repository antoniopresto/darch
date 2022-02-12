import { expectedType } from '@darch/utils/dist/expectedType';
import { getTypeName } from '@darch/utils/dist/getTypeName';
import { upperFirst } from '@darch/utils/dist/upperFirst';

import { FieldTypeParser, parseValidationError, ValidationCustomMessage } from './applyValidator';
export * from './applyValidator';

export type FieldTypeGraphql =
  | string
  | { name: string; sdl: string }
  | { name: string; fields: Record<string, string> };

// API used to convert field to another resources, like graphql.
export type FieldPortableAPIInput = {
  fieldName: string;
  parentName: string;
};

export type TAnyFieldType = FieldType<any, any, any>;

export abstract class FieldType<Type, TypeName extends string, Def extends Record<string, any> | any[] | undefined> {
  readonly typeName: TypeName;
  readonly _infer!: Type;
  readonly def: Def;

  protected constructor(typeName: TypeName, def: Def) {
    this.typeName = typeName;
    expectedType({ [`${typeName} definition`]: def }, ['object', 'array', 'undefined']);
    const defKeys = def ? Object.keys(def) : undefined;

    if (defKeys?.length) {
      this.def = def;
    }
  }

  validate(input: any): input is Type {
    try {
      this.parse(input);
      return true;
    } catch (e: any) {
      return false;
    }
  }

  isOptional = false;
  isList = false;

  optional(): this & { isOptional: true } {
    this.isOptional = true;
    return this as any;
  }

  list(): this & { isList: true } {
    this.isList = true;
    return this as any;
  }

  applyParser = <Type>(parser: { preParse?(input: any): Type; parse(input: any): Type }): FieldTypeParser<Type> => {
    return (input: any, customMessage?: ValidationCustomMessage) => {
      if (parser.preParse) {
        input = parser.preParse(input);
      }

      if (input === undefined && !this.isOptional) {
        throw new Error(`Required field`);
      }

      if (this.isList) {
        if (!Array.isArray(input)) {
          throw new Error(`expected Array, found ${getTypeName(input)}`);
        }
        const values: any = [];
        input.forEach(function (item, key) {
          try {
            const parsed = parser.parse(item);
            values.push(parsed);
          } catch (originalError: any) {
            const error = parseValidationError(item, customMessage, originalError);
            error.message = `${error.message} at position ${key}`;
            throw error;
          }
        });
        return values;
      }

      try {
        return parser.parse(input);
      } catch (originalError: any) {
        throw parseValidationError(input, customMessage, originalError);
      }
    };
  };

  abstract parse: FieldTypeParser<Type>;

  readonly __isFieldType = true;

  abstract graphql(api: FieldPortableAPIInput): FieldTypeGraphql;

  __portableName: string | undefined;
  mountPortableFieldName = (api: FieldPortableAPIInput) => {
    if (this.__portableName) return this.__portableName;
    const { parentName, fieldName } = api;
    return (this.__portableName = `${parentName}${upperFirst(fieldName)}${upperFirst(this.typeName)}`);
  };
}

export function isFieldType(t: any): t is FieldType<any, any, any> {
  return t?.__isFieldType === true;
}
