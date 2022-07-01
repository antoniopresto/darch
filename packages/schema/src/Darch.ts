import { dynamicRequire } from '@darch/utils/lib/dynamicRequire';
import { isBrowser } from '@darch/utils/lib/isBrowser';

export const __DarchModulesRecord__ = {
  graphql: {
    server: true,
    module: () => dynamicRequire('graphql', module) as typeof import('graphql'),
  },

  graphqlParser: {
    server: true,
    module: () =>
      dynamicRequire(
        './GraphType/GraphQLParser',
        module
      ) as typeof import('./GraphType/GraphQLParser'),
  },

  objectToTypescript: {
    server: true,
    module: () =>
      dynamicRequire(
        './objectToTypescript',
        module
      ) as typeof import('./objectToTypescript'),
  },

  prettier: {
    server: true,
    module: () =>
      dynamicRequire('prettier', module) as typeof import('prettier'),
  },

  createGraphQLSchema: {
    server: true,
    module: () =>
      dynamicRequire(
        './createGraphQLSchema',
        module
      ) as typeof import('./createGraphQLSchema'),
  },

  getQueryExamples: {
    server: true,
    module: () =>
      dynamicRequire(
        './GraphType/getQueryExamples',
        module
      ) as typeof import('./GraphType/getQueryExamples'),
  },

  createResolver: {
    server: true,
    module: () =>
      dynamicRequire(
        './GraphType/createResolver',
        module
      ) as typeof import('./GraphType/createResolver'),
  },

  clientUtils: {
    server: true,
    module: () =>
      dynamicRequire(
        './GraphType/generateClientUtils',
        module
      ) as typeof import('./GraphType/generateClientUtils'),
  },

  GraphType: {
    server: false,
    module: () =>
      require('./GraphType/GraphType') as typeof import('./GraphType/GraphType'),
  },
} as const;

export type DarchModulesRecord = typeof __DarchModulesRecord__;

export type DarchModules = {
  [K in keyof DarchModulesRecord]: DarchModulesRecord[K] extends {
    module: () => infer M;
  }
    ? M extends { [E in K]: infer Exported }
      ? M & Exported
      : M
    : never;
};

const resolved = {} as Partial<DarchModulesRecord>;

function get<K extends keyof DarchModules>(path: K): DarchModules[K] {
  if (resolved[path]) return resolved[path] as any;
  const item = __DarchModulesRecord__[path];
  if (!item) return undefined as any;

  if (item.server && isBrowser()) {
    throw new Error(
      `Trying to require ${path} in the browser.\n` +
        `       Server utils are only available on server side.\n`
    );
  }

  const value = item.module();

  if (!value || typeof value !== 'object') {
    throw new Error(`Failed to require (${path}).module() as an object.`);
  }

  let result: any = value;

  Object.entries(value).forEach(([k, v]) => {
    if (k === path && typeof v === 'function') {
      result = v;
      // if the module has a function with the same name exported, we set
      // all other items as static property of that module
      Object.keys(value).forEach((key) => {
        if (result[key] === undefined) {
          result[key] = value[key];
        }
      });
    }
  });

  return (resolved[path] = result);
}

// @ts-ignore
export const Darch: DarchModules = new Proxy({} as any, {
  get(_o, k: any) {
    const result = get(k);
    if (result === undefined) {
      throw new Error(`Trying to require undefined module ${k}.`);
    }
    return result;
  },

  has(_o, k: any) {
    const value = get(k);
    return value !== undefined;
  },

  ownKeys() {
    return Reflect.ownKeys(__DarchModulesRecord__);
  },

  getOwnPropertyDescriptor(_o, k: any) {
    return Object.getOwnPropertyDescriptor(__DarchModulesRecord__, k);
  },
});
