import { expectedType } from '@darch/utils/lib/expectedType';

import { FieldType, FieldTypeParser } from '../FieldType';

export type StringFieldDef = {
  min?: number;
  max?: number;
  regex?: [string] | [string, string];
};

export class StringField extends FieldType<string, 'string', StringFieldDef | undefined> {
  parse: FieldTypeParser<string>;

  constructor(def: StringFieldDef = {}) {
    super('string', def);

    const { min, max, regex } = def;

    expectedType({ min, max }, 'number', true);
    expectedType({ regex }, 'array', true);

    const regExp = regex && new RegExp(regex[0], regex[1]);

    this.parse = this.applyParser({
      parse(input: string) {
        expectedType({ value: input }, 'string');

        if (regExp && !regExp.test(input) && regex) {
          throw new Error(`Invalid`);
        }

        const length = input.length;

        if (max !== undefined && length > max) {
          throw new Error(`${length} is more than the max length ${max}.`);
        }

        if (min !== undefined && length < min) {
          throw new Error(`${length} is less than the min length ${min}.`);
        }

        return input;
      },
    });
  }

  static create = (def?: StringFieldDef): StringField => {
    return new StringField(def);
  };

  graphql = () => 'String';
}
