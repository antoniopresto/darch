import _memoize from 'lodash/memoize';

interface memoize {
  <T extends (...args: any) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => any
  ): T;
}

export function memoize(...args: any[]) {
  // @ts-ignore
  return _memoize(...args);
}
