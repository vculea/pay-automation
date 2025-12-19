import { test as base, expect } from '@playwright/test';

const test = base.extend<{ storage: any }>({
  storage: async ({}, use: any) => {
    const data: any = {};
    const storageManager = {
      set: (key: string, value: any) => { data[key] = value; },
      get: (key: string) => data[key],
      getAll: () => data,
      clear: () => { for (let key in data) delete data[key]; }
    };

    await use(storageManager);
  },
});

export { test, expect };