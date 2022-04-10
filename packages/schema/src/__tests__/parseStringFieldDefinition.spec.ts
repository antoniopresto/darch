import { getKeys } from '@darch/utils/lib/getKeys';

import { fieldTypeConstructors } from '../fields/fieldTypes';
import { parseStringDefinition } from '../parseStringDefinition';

const definitions = getKeys(fieldTypeConstructors)
  .map((type) => {
    return [
      [type, { type, optional: false, list: false }],
      [`${type}?`, { type, optional: true, list: false }],
      [`[${type}]`, { type, optional: false, list: true }],
      [`[${type}]?`, { type, optional: true, list: true }],
    ] as const;
  })
  .flat();

describe('parseStringDefinition', () => {
  it('string', () => {
    let sut = parseStringDefinition('string');

    expect(sut).toEqual({
      type: 'string',
      list: false,
      optional: false,
    });
  });

  it('works', () => {
    definitions.forEach(function (item) {
      const type = item[0];
      const expected = item[1];

      const sut = parseStringDefinition(type);

      expect(sut).toEqual(expected);
    });
  });
});
