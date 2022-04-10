import { RuntimeError } from './RuntimeError';

export class StrictMap<K, V> {
  nativeMap: Map<K, V>;

  constructor() {
    this.nativeMap = new Map<K, V>();
  }

  ensure(key: K) {
    this.get(key);
  }

  get(key): NonNullable<V> {
    if (!this.nativeMap.has(key)) {
      throw new StrictMapError(`There is no item with key "${key}"`, {
        validKeys: [...this.nativeMap.keys()],
      });
    }

    const value = this.nativeMap.get(key);

    if (value === undefined || value === null) {
      throw new StrictMapError(
        `Expected value to be not nullable, but received ${
          value === null ? 'null' : 'undefined'
        }.`,
        {
          validKeys: [...this.nativeMap.keys()],
        }
      );
    }

    return value as NonNullable<V>;
  }

  set = (key: K, value: V) => {
    return this.nativeMap.set(key, value);
  };

  has = (key: any) => {
    return this.nativeMap.has(key);
  };

  keys = () => {
    return this.nativeMap.keys();
  };

  entries = () => {
    return this.nativeMap.entries();
  };

  clear = () => {
    return this.nativeMap.clear();
  };

  delete = (key: K) => {
    return this.nativeMap.delete(key);
  };

  values = () => {
    return this.nativeMap.values();
  };

  get size() {
    return this.nativeMap.size;
  }
}

class StrictMapError extends RuntimeError {
  constructor(message, details) {
    super(message, details);
    this.name = 'StrictMapError';
  }
}
