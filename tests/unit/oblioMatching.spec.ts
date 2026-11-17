import { expect, test } from "@playwright/test";
import type { OblioDocument } from "../../pages/oblio/OblioPage";
import { findDocument } from "../../utils/oblioMatching";

const day = (d: number) => new Date(2025, 0, d);
const target = { date: day(15), currency: "RON" };

function doc(number: string, amount: number, date = day(15), currency = "RON"): OblioDocument {
  return { supplier: "S", number, documentDate: date, receivedDate: date, amount, currency, url: "" };
}

test.describe("findDocument", () => {
  test("matches same currency, amount and date within tolerance", () => {
    const d = doc("A", 100);
    expect(findDocument(target, 100, [d])).toBe(d);
    expect(findDocument(target, 100, [doc("B", 100, day(24))])?.number).toBe("B");
  });

  test("rejects other currency", () => {
    expect(findDocument(target, 100, [doc("A", 100, day(15), "EUR")])).toBeUndefined();
  });

  test("rejects dates outside tolerance", () => {
    expect(findDocument(target, 100, [doc("A", 100, day(27))])).toBeUndefined();
  });

  test("prefers the closest amount", () => {
    expect(findDocument(target, 100.05, [doc("A", 100.01), doc("B", 100.04)])?.number).toBe("B");
  });

  test("assigns distinct documents to slots once used ones are removed", () => {
    const first = doc("A", 100);
    const second = doc("B", 250);
    const unused = new Set([first, second]);
    const slotOne = findDocument(target, 100, unused);
    expect(slotOne).toBe(first);
    unused.delete(slotOne!);
    expect(findDocument(target, 250, unused)).toBe(second);
    expect(findDocument(target, 100, unused)).toBeUndefined();
  });
});