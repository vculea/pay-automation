import { test as base } from "@playwright/test";
import { restoreCaserieSession } from "./caserieAuth";

export const test = base.extend({
  page: async ({ page, context }, use) => {
    await restoreCaserieSession(context);
    await use(page);
  }
});
