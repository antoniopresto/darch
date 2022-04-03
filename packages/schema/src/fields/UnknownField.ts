import { getTypeName } from '@darch/utils/dist/getTypeName';

import { FieldType, FieldTypeParser } from '../FieldType';

export type UnknownFieldDef = {
  types?: string[] | string;
};

export class UnknownField extends FieldType<unknown, 'unknown', UnknownFieldDef | undefined> {
  parse: FieldTypeParser<any>;

  constructor(def?: UnknownFieldDef) {
    super('unknown', def);
    const { types } = def || {};

    this.parse = this.applyParser({
      parse: (input) => {
        if (input === undefined) {
          if (this.optional) return input;
          throw new Error(`Required field`);
        }

        if (types?.length) {
          const arr = (Array.isArray(types) ? types : [types]).map((el) => el.toLowerCase());

          const tn = getTypeName(input).toLowerCase();

          if (!arr.includes(tn)) {
            throw new Error(`expected type to be one of -> (${arr.join(', ')}), found "${tn}"`);
          }
        }

        return input;
      },
    });
  }

  static create = (def?: UnknownFieldDef): UnknownField => {
    return new UnknownField(def);
  };

  graphql = () => ({
    name: 'Unknown',
    sdl: 'scalar Unknown',
  });
}
