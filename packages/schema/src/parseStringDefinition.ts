import { memo } from '@darch/utils/dist/memo';

import { isFieldTypeName } from './fields/fieldTypes';
import { FinalFieldDefinition } from './fields/_parseFields';
import { FieldTypeName } from './fields/_fieldDefinitions';

function _parseStringDefinition<T extends AnyStringFieldDefinition>(
  typeName: T
): FinalFieldDefinition {
  const t = typeNameFromTemplate(typeName);
  const isOptional = isOptionalTemplate(typeName);
  const isList = isListTemplate(typeName);

  const obj = Object.freeze({
    type: t,
    optional: isOptional,
    list: isList,
  });

  return obj as any;
}

function _isOptionalTemplate<T extends string>(
  type: T
): T extends `${string}?` ? true : false {
  return !!type.match(/\?$/) as any;
}

function _isListTemplate<T extends string>(
  type: T
): T extends `[${string}]` | `[${string}]?` ? true : false {
  return !!type.match(/]\??$/) as any;
}

function _typeNameFromTemplate<T extends FieldTypeName>(
  enhanced: AnyStringFieldDefinition
): T {
  return enhanced.replace(/[\[\]?, ]/g, '') as any;
}

function _isStringFieldDefinition(t: any): t is AnyStringFieldDefinition {
  if (typeof t !== 'string') return false;
  const field = typeNameFromTemplate(t as any);
  return isFieldTypeName(field);
}

export const parseStringDefinition = memo(_parseStringDefinition);
export const typeNameFromTemplate = memo(_typeNameFromTemplate);
export const isStringFieldDefinition = memo(_isStringFieldDefinition);
export const isListTemplate = memo(_isListTemplate);
export const isOptionalTemplate = memo(_isOptionalTemplate);

export type AnyStringFieldDefinition =
  | FieldTypeName
  | `${FieldTypeName}?`
  | `[${FieldTypeName}]`
  | `[${FieldTypeName}]?`;

export type ExtractStringFieldDefType<T extends AnyStringFieldDefinition> =
  //
  T extends FieldTypeName
    ? T
    : T extends `[${infer U}]?`
    ? U
    : T extends `${infer U}?`
    ? U
    : T extends `[${infer U}]`
    ? U
    : never;

export type ParseStringDefinition<S> =
  //
  S extends FieldTypeName
    ? {
        type: S;
        list: false;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    //
    S extends `${FieldTypeName}?`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: false;
        optional: true;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: true;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]?`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: true;
        optional: true;
        def: undefined;
        description?: string;
      }
    : never;
