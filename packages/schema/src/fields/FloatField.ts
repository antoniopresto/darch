import { expectedType } from '@darch/utils/lib/expectedType';

import { FieldType, FieldTypeParser } from '../FieldType';

export type FloatFieldDef = {
  min?: number;
  max?: number;
};

export class FloatField extends FieldType<number, 'float', FloatFieldDef | undefined> {
  parse: FieldTypeParser<number>;

  constructor(def: FloatFieldDef = {}) {
    super('float', def);

    const { min, max } = def;

    expectedType({ min, max }, 'number', true);

    this.parse = this.applyParser({
      preParse(input: any) {
        if (typeof input === 'string') {
          const asNumber = +input;
          if (!isNaN(asNumber)) return asNumber;
        }
        return input;
      },
      parse: (input: number) => {
        expectedType({ value: input }, 'number');

        if (max !== undefined && input > max) {
          throw new Error(`${input} is more than the maximum ${max}.`);
        }

        if (min !== undefined && input < min) {
          throw new Error(`${input} is less than the minimum ${min}.`);
        }

        return input;
      },
    });
  }

  static create = (def: FloatFieldDef = {}): FloatField => {
    return new FloatField(def);
  };

  graphql = () => 'Float';

  toString = () => `${this.typeName}(${this.def || ''})`;
}
