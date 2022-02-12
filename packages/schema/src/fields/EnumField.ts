import { FieldPortableAPIInput, FieldType, FieldTypeParser } from '../FieldType';

export class EnumField<U extends string, T extends Readonly<[U, ...U[]]>> extends FieldType<T[number], 'enum', T> {
  //
  parse: FieldTypeParser<T[number]>;

  constructor(def: T) {
    super('enum', def);

    this.parse = this.applyParser({
      parse: (input: any) => {
        if (!this.def.includes(input)) {
          throw new Error(`accepted: ${this.def.map((e) => `'${e}'`).join(' or ')}, found ${input}.`);
        }

        return input;
      },
    });
  }

  static create = <U extends string, T extends Readonly<[U, ...U[]]>>(def: T): FieldType<T[number], 'enum', T> => {
    return new EnumField(def);
  };

  graphql = (api: FieldPortableAPIInput) => {
    const name = this.mountPortableFieldName(api);

    return {
      name,
      sdl: `enum ${name} { ${this.def.join(' ')} }`,
    };
  };
}
