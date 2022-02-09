// thanks from graphql-compose
export function createProxy<T extends Record<string, any>>(thunk: () => T): T {
  const data = {} as any;
  let isResolved = false;
  const getFC: any = () => {
    if (!isResolved) {
      isResolved = true;
      const tmp = typeof thunk === 'function' ? thunk() : thunk;
      Object.keys(tmp).forEach((k) => {
        data[k] = tmp[k];
      });
    }
    return data;
  };

  const proxy = new Proxy(data, {
    get(_o, k) {
      return getFC()[k];
    },
    set(_o, k, v) {
      getFC()[k] = v;
      return true;
    },
    has(_o, k) {
      return k in getFC();
    },
    deleteProperty(_o, k) {
      delete getFC()[k];
      return true;
    },
    // enumerate() {
    //   return Object.keys(getFC())[Symbol.iterator]();
    // },
    // iterate(oTarget, sKey) {
    //   return oTarget.keys();
    // },
    ownKeys() {
      return Reflect.ownKeys(getFC());
    },
    // hasOwn(oTarget, sKey) {
    //   console.log('hasOwn');
    //   return Object.
    // },
    defineProperty(_o, k, d: any) {
      return Object.defineProperty(getFC(), k, d);
    },
    // getPropertyNames() {
    //   return Object.getPropertyNames(getFC());
    // },
    // @ts-expect-error
    getOwnPropertyNames() {
      return Object.getOwnPropertyNames(getFC());
    },
    // getPropertyDescriptor(o, k) {
    //   return Object.getPropertyDescriptor(getFC(), k);
    // },
    getOwnPropertyDescriptor(_o, k: any) {
      return Object.getOwnPropertyDescriptor(getFC(), k);
    },
  });

  return proxy as any;
}
