import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrowserContext } from "@playwright/test";

export const caserieAuthFile = resolve("playwright", ".auth", "caserie.json");
export const caserieSessionFile = resolve("playwright", ".auth", "caserie.session.json");
export const caserieUrl = "http://localhost:5173/";

export async function restoreCaserieSession(context: BrowserContext) {
  const entries: unknown = JSON.parse(readFileSync(caserieSessionFile, "utf8"));
  if (
    !Array.isArray(entries) ||
    !entries.every(
      (entry): entry is [string, string] =>
        Array.isArray(entry) && entry.length === 2 && entry.every(value => typeof value === "string")
    )
  ) {
    throw new Error("Invalid Caserie session file. Remove the saved Caserie authentication files and sign in again.");
  }

  await context.addInitScript(
    ({ origin, entries }) => {
      if (window.location.origin === origin) {
        for (const [key, value] of entries) {
          if (window.sessionStorage.getItem(key) === null) {
            window.sessionStorage.setItem(key, value);
          }
        }
      }
    },
    { origin: new URL(caserieUrl).origin, entries }
  );
}
