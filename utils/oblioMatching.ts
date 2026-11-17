import type { OblioDocument } from "../pages/oblio/OblioPage";

export const TOLERANCE_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export function amountInCents(amount: number) {
  return Math.round(Math.abs(amount) * 100);
}

export function amountDifferenceInCents(left: number, right: number) {
  return Math.abs(amountInCents(left) - amountInCents(right));
}

export function amountsShareTenths(left: number, right: number) {
  return Math.floor(amountInCents(left) / 10) === Math.floor(amountInCents(right) / 10);
}

export function dateDistance(target: { date: Date; currency: string }, document: OblioDocument) {
  return Math.min(
    Math.abs(target.date.getTime() - document.documentDate.getTime()),
    Math.abs(target.date.getTime() - document.receivedDate.getTime())
  );
}

export function findDocument(
  target: { date: Date; currency: string },
  amount: number,
  documents: Iterable<OblioDocument>
): OblioDocument | undefined {
  return [...documents]
    .filter(
      d =>
        d.currency === target.currency &&
        amountsShareTenths(d.amount, amount) &&
        dateDistance(target, d) <= TOLERANCE_DAYS * DAY_MS
    )
    .sort(
      (a, b) =>
        amountDifferenceInCents(amount, a.amount) - amountDifferenceInCents(amount, b.amount) ||
        dateDistance(target, a) - dateDistance(target, b)
    )[0];
}