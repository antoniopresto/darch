import { expectedType } from '@darch/utils/lib/expectedType';

import { FieldType, FieldTypeParser } from '../FieldType';

type EmailDef = {
  errorMessage?: string;
  regex?: [string] | [string, string];
};

// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/web_tests/fast/forms/resources/ValidityState-typeMismatch-email.js?q=ValidityState-typeMismatch-email.js&ss=chromium
// https://stackoverflow.com/questions/46155/whats-the-best-way-to-validate-an-email-address-in-javascript/46181#46181
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export class EmailField extends FieldType<string, 'email', EmailDef | undefined> {
  parse: FieldTypeParser<string>;

  constructor(def: EmailDef = {}) {
    super('email', def);

    let { regex: _regex = emailRegex } = def;

    if (def.regex && !Array.isArray(def.regex)) {
      throw new Error(`Invalid regex definition received. Expected [string] | [string, string].`);
    }

    const regex = Array.isArray(_regex) ? new RegExp(_regex[0], _regex[1]) : _regex;

    this.parse = this.applyParser({
      parse: (input: any) => {
        expectedType({ value: input }, 'string');

        if (!regex.test(input)) {
          throw new Error(`Invalid email received.`);
        }

        return input;
      },
    });
  }

  static create = (def?: EmailDef): EmailField => {
    return new EmailField(def);
  };

  graphql = () => ({ name: 'Email', sdl: 'scalar Email' });
}
