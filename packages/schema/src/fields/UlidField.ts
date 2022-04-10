import { expectedType } from '@darch/utils/lib/expectedType';
import { ulid } from '@darch/utils/lib/ulid';

import { FieldType, FieldTypeParser } from '../FieldType';

type UlidDef = {
  autoCreate?: boolean;
};

export const ULID_REGEX = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

export class UlidField extends FieldType<string, 'ulid', UlidDef | undefined> {
  parse: FieldTypeParser<string>;

  constructor(def: UlidDef = {}) {
    super('ulid', def);

    const { autoCreate } = def;
    expectedType({ autoCreate }, 'boolean', true);

    this.parse = this.applyParser({
      preParse(input) {
        if (autoCreate && input === undefined) {
          return ulid();
        }
        return input;
      },
      parse(input: string) {
        expectedType({ value: input }, 'string');
        if (!ULID_REGEX.test(input)) throw new Error('Invalid ulid.');
        return input;
      },
    });
  }

  static create = (def?: UlidDef): UlidField => {
    return new UlidField(def);
  };

  static isUlid = (value: string) => ULID_REGEX.test(value);

  graphql = () => ({
    name: 'Ulid',
    sdl: 'scalar Ulid',
  });
}
