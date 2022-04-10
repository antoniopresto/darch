import { expectedType } from '@darch/utils/lib/expectedType';

import { FieldType, FieldTypeParser } from '../FieldType';

export class NullField extends FieldType<string, 'null', undefined> {
  parse: FieldTypeParser<string>;

  constructor() {
    super('null', undefined);

    this.parse = this.applyParser({
      parse(input: string) {
        expectedType({ value: input }, 'null');
        return input;
      },
    });
  }

  static create = (): NullField => {
    return new NullField();
  };

  graphql = () => ({
    name: 'Null',
    sdl: 'scalar Null',
  });
}
