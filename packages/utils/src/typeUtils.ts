// https://stackoverflow.com/questions/46176165/ways-to-get-string-literal-type-of-array-values-without-enum-overhead
export const tuple = <T extends string[]>(...args: T) => args;

export const tupleNum = <T extends number[]>(...args: T) => args;

export const tupleEnum = <T extends string[]>(
  ...values: T
): { readonly [K in T[number]]: K } => {
  return values.reduce((p, n) => {
    return {
      ...p,
      [n]: n,
    };
  }, Object.create(null));
};

export type ObjectKey<T> = T extends Record<string, any> ? T[keyof T] : never;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type IsNullable<T> = Extract<T, null | undefined> extends never
  ? false
  : true;

export type IsUnknown<T> = IsNever<T> extends false
  ? T extends unknown
    ? unknown extends T
      ? IsAny<T> extends false
        ? true
        : false
      : false
    : false
  : false;

export type OnlyKnown<T> = IsAny<T> extends true
  ? undefined
  : IsNever<T> extends true
  ? undefined
  : IsUnknown<T> extends true
  ? undefined
  : T;

export type MaybePromise<T> = T | Promise<T>;

export type PromiseType<P> = P extends Promise<infer T> ? T : never;

export type MaybeArray<T> = T | T[];

export type ArrayType<T> = T extends Array<infer N> ? N : T;

export type AnyRecord = Record<string, any>;

export type IfExtends<Param, Type, IfTrue, IfFalse> = Param extends Type
  ? IfTrue
  : IfFalse;

export type ObjectUnion<A, B> = {
  [K in keyof (A & B)]: (A & B)[K];
};

export type Entries<T> = {
  [K in Extract<keyof T, string>]-?: [K, T[K]];
}[Extract<keyof T, string>][];

export type AnyFunction = (...args: any[]) => any;

export type Writeable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type ForceString<T> = T extends string ? T : never;
export type NotString<T> = string extends T ? never : T;

export type NullableToPartial<T> = T extends { [K: string]: any }
  ? {
      [K in keyof ({
        [K in NullableKeys<T>]?: T[K];
      } & {
        [K in RequiredKeys<T>]-?: T[K];
      })]: ({
        [K in NullableKeys<T>]?: T[K];
      } & {
        [K in RequiredKeys<T>]-?: T[K];
      })[K];
    }
  : never;

export type NullableKeys<T> = Extract<NullableByKind<T, 'nullable'>, string>;

export type RequiredKeys<T> = Extract<NullableByKind<T, 'required'>, string>;

export type NullableByKind<T, Kind extends 'nullable' | 'required'> = {
  [K in keyof T]?: IsNullable<T[K]> extends (
    Kind extends 'nullable' ? true : false
  )
    ? K
    : never;
}[keyof T] extends infer Temp
  ? Temp extends undefined
    ? never
    : Temp
  : never;

export type Simplify<T> = {[KeyType in keyof T]: T[KeyType]};
