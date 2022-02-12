import { getTypeName } from '@darch/utils/dist/getTypeName';
import { inspectObject } from '@darch/utils/dist/inspectObject';
import { uniq } from '@darch/utils/dist/uniq';

import { FieldType, FieldTypeParser } from '../FieldType';
import type { FieldDefinitionConfig } from '../TSchemaConfig';
import type { TypeFromSchema } from '../TSchemaParser';

import type { AnyFieldTypeInstance } from './fieldTypes';

export class UnionField<U extends FieldDefinitionConfig, T extends Readonly<[U, ...U[]]>> extends FieldType<
  TypeFromSchema<T[number]>,
  'union',
  T
> {
  //
  parse: FieldTypeParser<TypeFromSchema<T[number]>>;

  constructor(def: T) {
    super('union', def);

    const { parseSchemaField } = require('../parseSchemaDefinition');

    const parsers: AnyFieldTypeInstance[] = def.map((el, index) => {
      try {
        return parseSchemaField(`UnionItem_${index}`, el, true);
      } catch (e: any) {
        let message = `Filed to parse type:`;
        message += `\n${inspectObject(el, { tabSize: 2 })}`;

        e.stack = message + '\n' + e.stack;
        throw e;
      }
    });

    const hasOptional = (parsers as any[]).some((el) => el.isOptional);

    if (hasOptional) {
      this.isOptional = true;
    }

    this.parse = this.applyParser({
      parse: (input: any) => {
        if (input === undefined && this.isOptional) return input;

        const schemaErrors: any[] = [];

        for (let parser of parsers) {
          try {
            return parser.parse(input);
          } catch (e) {
            if (parser.typeName === 'schema' && getTypeName(input) === 'Object') {
              schemaErrors.push(e);
            }
          }
        }

        if (schemaErrors.length) {
          throw schemaErrors[0];
        }

        const expected = uniq(parsers.map((el) => el.typeName)).join(' or ');

        throw new Error(`Expected value to match one of the following types: ${expected}.`);
      },
    });
  }

  static create = <U extends FieldDefinitionConfig, T extends Readonly<[U, ...U[]]>>(
    def: T
  ): FieldType<TypeFromSchema<T[number]>, 'union', T> => {
    return new UnionField(def);
  };

  graphql = () => ({
    name: 'FIXMEUnionFIXME',
    sdl: 'scalar FIXMEUnionFIXME', // TODO
  });
}
