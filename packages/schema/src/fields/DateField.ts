import { expectedType } from '@darch/utils/lib/expectedType';

import { FieldType, FieldTypeParser } from '../FieldType';

export type DateFieldDef = {
  min?: Date;
  max?: Date;
};

export class DateField extends FieldType<Date, 'date', DateFieldDef | undefined> {
  parse: FieldTypeParser<Date>;

  constructor(def: DateFieldDef = {}) {
    super('date', def);
    const { min, max } = def;

    let minTime = 0;
    let maxTime = 0;

    expectedType({ min, max }, 'date', true);

    if (min !== undefined) {
      minTime = min.getTime();
    }

    if (max !== undefined) {
      maxTime = max.getTime();
    }

    this.parse = this.applyParser({
      parse: (input: any) => {
        expectedType({ value: input }, 'date');

        const inputTime = input.getTime();

        if (minTime !== 0 && inputTime < minTime && min) {
          throw new Error(`${input.toISOString()} is less than the minimum ${min.toISOString()}.`);
        }

        if (maxTime !== 0 && inputTime > maxTime && max) {
          throw new Error(`${input.toISOString()} is more than the maximum ${max.toISOString()}.`);
        }

        return input;
      },
    });
  }

  static create = (def: DateFieldDef = {}): DateField => {
    return new DateField(def);
  };

  graphql = () => ({ name: 'Date', sdl: 'scalar Date' });
}
