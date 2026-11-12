import { OblioDocument, OblioPage } from "../../pages/oblio/OblioPage";
import { Transaction, TransactionsPage } from "../../pages/caserie/TransactionsPage";
import { test } from "../../setup/caserieTest";
import { credentials } from "../../utils/configs";

const TOLERANCE_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function dateDistance(transaction: Transaction, document: OblioDocument) {
  return Math.min(
    Math.abs(transaction.date.getTime() - document.documentDate.getTime()),
    Math.abs(transaction.date.getTime() - document.receivedDate.getTime())
  );
}

test("Attach Oblio eFactura to every matching transaction", async ({ page, context }) => {
  const oblio = new OblioPage(page);
  await oblio.login(credentials);

  const transactionsPage = new TransactionsPage(await context.newPage());
  await transactionsPage.goTo();
  const transactions = await transactionsPage.getTransactions();

  const oldest = new Date(Math.min(...transactions.map(t => t.date.getTime())) - TOLERANCE_DAYS * DAY_MS);
  const documents = await oblio.getDocuments(oldest);
  const unused = new Set(documents);

  const unmatched: Transaction[] = [];
  const attached: string[] = [];
  const skipped: string[] = [];

  for (const transaction of transactions) {
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

  console.log(`Attached (${attached.length}):\n${attached.join("\n")}`);
  console.log(`Skipped (${skipped.length}):\n${skipped.join("\n")}`);
  console.log(
    `No Oblio match (${unmatched.length}):\n${unmatched.map(t => `${t.category} ${t.amount} ${t.currency}`).join("\n")}`
  );
});
