import { getTypeName } from '@darch/utils/lib/getTypeName';

import { FieldType, FieldTypeParser } from '../FieldType';
export class BooleanField extends FieldType<boolean, 'boolean', undefined> {
  parse: FieldTypeParser<boolean>;

  constructor() {
    super('boolean', undefined);
    this.parse = this.applyParser({
      parse: (input) => {
        if (typeof input !== 'boolean') {
          throw new Error(`Expected boolean, found ${getTypeName(input)}`);
        }
        return input;
      },
    });
  }

  static create = (): BooleanField => {
    return new BooleanField();
  };

  graphql = () => 'Boolean';
}
