import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { CaseriePage } from "../pages/caserie/CaseriePage";
import { caserieAuthFile, caserieSessionFile, caserieUrl, restoreCaserieSession } from "./caserieAuth";

const hasSavedSession = existsSync(caserieAuthFile) && existsSync(caserieSessionFile);

setup.use({
  storageState: hasSavedSession ? caserieAuthFile : undefined,
  trace: "off",
  screenshot: "off",
  video: "off"
});

setup("Authenticate Caserie with Google", async ({ page, context }) => {
  setup.setTimeout(300_000);
  if (hasSavedSession) {
    await restoreCaserieSession(context);
  }
  const caserie = new CaseriePage(page);
  await caserie.goTo();
  await caserie.loginButton.or(page.getByRole("main")).first().waitFor();

  if (await caserie.loginButton.isVisible()) {
    console.log("Complete Google sign-in in the opened browser. The application session will be saved locally.");
    await caserie.loginButton.click();
  }

  await caserie.expectAuthenticated(240_000);
  const state = await context.storageState({ indexedDB: true });
  const appUrl = new URL(caserieUrl);
  state.cookies = state.cookies.filter(cookie => cookie.domain.replace(/^\./, "") === appUrl.hostname);
  state.origins = state.origins.filter(origin => origin.origin === appUrl.origin);
  const sessionEntries = await page.evaluate(() => Object.entries(window.sessionStorage));
  mkdirSync(dirname(caserieAuthFile), { recursive: true });
  writeFileSync(caserieAuthFile, JSON.stringify(state), { mode: 0o600 });
  writeFileSync(caserieSessionFile, JSON.stringify(sessionEntries), { mode: 0o600 });
});
