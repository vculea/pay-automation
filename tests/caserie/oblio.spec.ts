import { OblioDocument, OblioPage } from "../../pages/oblio/OblioPage";
import { Transaction, TransactionsPage } from "../../pages/caserie/TransactionsPage";
import { test } from "../../setup/caserieTest";
import { credentials } from "../../utils/configs";

const TOLERANCE_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_SUPPORTED_YEAR = 2024;
// Caserie offers the eFactură attachment zone only for expenses (frontend/src/pages/attachmentZones.ts).
const EXPENSE_TYPE = "Cheltuială";

function dateDistance(transaction: Transaction, document: OblioDocument) {
  return Math.min(
    Math.abs(transaction.date.getTime() - document.documentDate.getTime()),
    Math.abs(transaction.date.getTime() - document.receivedDate.getTime())
  );
}

test("Attach Oblio eFactura to every matching transaction", async ({ page, context }) => {
  test.setTimeout(30 * 60 * 1000);

  const oblio = new OblioPage(page);
  await oblio.login(credentials);
  const documents = await oblio.getDocuments(new Date(0));
  if (!documents.length) {
    throw new Error("No Oblio documents were returned.");
  }

  const transactionsPage = new TransactionsPage(await context.newPage());
  await transactionsPage.goTo();
  const unused = new Set(documents);
  const oldestDocumentDate = documents.reduce(
    (oldest, document) => Math.min(oldest, document.documentDate.getTime(), document.receivedDate.getTime()),
    Number.POSITIVE_INFINITY
  );
  const oldestWithTolerance = new Date(oldestDocumentDate - TOLERANCE_DAYS * DAY_MS);
  const firstMonth = Math.max(
    FIRST_SUPPORTED_YEAR * 12,
    oldestWithTolerance.getFullYear() * 12 + oldestWithTolerance.getMonth()
  );
  if (oldestWithTolerance.getFullYear() < FIRST_SUPPORTED_YEAR) {
    console.log(`Stopping at January ${FIRST_SUPPORTED_YEAR}, the earliest selectable month in Caserie.`);
  }
  const currentMonth = new Date();
  const currentMonthIndex = currentMonth.getFullYear() * 12 + currentMonth.getMonth();

  for (let monthIndex = currentMonthIndex; monthIndex >= firstMonth; monthIndex--) {
    const period = {
      year: Math.floor(monthIndex / 12),
      month: monthIndex % 12
    };
    await transactionsPage.selectPeriod(period);
    const transactions = await transactionsPage.getTransactions();
    const unmatched: Transaction[] = [];
    const attached: string[] = [];
    const skipped: string[] = [];

    for (const transaction of transactions) {
      if (transaction.type !== EXPENSE_TYPE) continue;
      const candidates = [...unused]
        .filter(
          d =>
            d.currency === transaction.currency &&
            Math.abs(d.amount - transaction.amount) < 0.005 &&
            dateDistance(transaction, d) <= TOLERANCE_DAYS * DAY_MS
        )
        .sort((a, b) => dateDistance(transaction, a) - dateDistance(transaction, b));
      const document = candidates[0];
      if (!document) {
        unmatched.push(transaction);
        continue;
      }
      unused.delete(document);

      await transactionsPage.openEdit(transaction);
      if (await transactionsPage.hasEInvoice()) {
        skipped.push(`${transaction.category} ${transaction.amount} (already has eFactura)`);
        await transactionsPage.page.keyboard.press("Escape");
        continue;
      }
      const name = `${document.number.replace(/[^\w.-]+/g, "_")}.pdf`;
      await transactionsPage.attachEInvoice({ name, buffer: await oblio.downloadPdf(document) });
      attached.push(`${transaction.category} ${transaction.amount} <- ${document.supplier} ${document.number}`);
    }

    const label = new Date(period.year, period.month, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    console.log(`${label} — Attached (${attached.length}):\n${attached.join("\n")}`);
    console.log(`${label} — Skipped (${skipped.length}):\n${skipped.join("\n")}`);
    console.log(
      `${label} — No Oblio match (${unmatched.length}):\n${unmatched.map(t => `${t.category} ${t.amount} ${t.currency}`).join("\n")}`
    );
  }
});
