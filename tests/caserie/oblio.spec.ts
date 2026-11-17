import { OblioDocument, OblioPage } from "../../pages/oblio/OblioPage";
import { Transaction, TransactionsPage } from "../../pages/caserie/TransactionsPage";
import { test } from "../../setup/caserieTest";
import { credentials } from "../../utils/configs";
import { amountDifferenceInCents, findDocument, TOLERANCE_DAYS } from "../../utils/oblioMatching";

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_SUPPORTED_YEAR = 2024;
// Expense categories can further restrict the attachment zone; inspect the edit dialog before uploading.
const EXPENSE_TYPE = "Cheltuială";

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
      if (transaction.type !== EXPENSE_TYPE || transaction.eInvoiceStatus !== "Nu") continue;
      const document = findDocument(transaction, transaction.amount, unused);
      const amountDifference = document ? amountDifferenceInCents(transaction.amount, document.amount) : 0;
      if (document && amountDifference > 0) {
        const warning =
          `Amount differs by ${(amountDifference / 100).toFixed(2)} ${transaction.currency}: ` +
          `Caserie ${transaction.date.toLocaleDateString("ro-RO")} ${transaction.category} ` +
          `${transaction.amount.toFixed(2)} ${transaction.currency}; ` +
          `Oblio ${document.supplier} ${document.number} ${document.amount.toFixed(2)} ${document.currency}.`;
        console.warn(`WARNING: ${warning}`);
        test.info().annotations.push({ type: "warning", description: warning });
      }

      const edit = await transactionsPage.openEdit(transaction);
      if (edit.status === "blocked") {
        const warning =
          `${transaction.date.toLocaleDateString("ro-RO")} ${transaction.category} ` +
          `${transaction.amount.toFixed(2)} ${transaction.currency}: ${edit.reason}`;
        console.warn(`WARNING: ${warning}`);
        test.info().annotations.push({ type: "warning", description: warning });
        skipped.push(warning);
        continue;
      }

      if (!document) {
        const invoiceSlots = await transactionsPage.getInvoiceSlots();
        if (!invoiceSlots.length) {
          await transactionsPage.closeEdit();
          unmatched.push(transaction);
          continue;
        }

        const selected = new Set<OblioDocument>();
        const uploads: {
          slot: number;
          amount: number;
          file: { name: string; buffer: Buffer };
          document: OblioDocument;
        }[] = [];
        for (const slot of invoiceSlots) {
          const slotDocument = findDocument(
            transaction,
            slot.amount,
            [...unused].filter(candidate => !selected.has(candidate))
          );
          if (!slotDocument) {
            const warning =
              `${transaction.date.toLocaleDateString("ro-RO")} ${transaction.category} ` +
              `invoice ${slot.index} (${slot.amount.toFixed(2)} ${transaction.currency}): no matching Oblio document.`;
            console.warn(`WARNING: ${warning}`);
            test.info().annotations.push({ type: "warning", description: warning });
            continue;
          }
          selected.add(slotDocument);
          if (slot.eInvoiceStored) {
            unused.delete(slotDocument);
            skipped.push(
              `${transaction.category} invoice ${slot.index} ${slot.amount} (already has eFactura: ` +
                `${slotDocument.supplier} ${slotDocument.number})`
            );
            continue;
          }
          if (!slot.eInvoiceUploadable) {
            const warning =
              `${transaction.date.toLocaleDateString("ro-RO")} ${transaction.category} ` +
              `invoice ${slot.index} ${slot.amount.toFixed(2)} ${transaction.currency}: eFactura upload is unavailable; ` +
              `Oblio ${slotDocument.supplier} ${slotDocument.number} was not attached.`;
            console.warn(`WARNING: ${warning}`);
            test.info().annotations.push({ type: "warning", description: warning });
            continue;
          }
          const name = `${slotDocument.number.replace(/[^\w.-]+/g, "_")}.pdf`;
          uploads.push({
            slot: slot.index,
            amount: slot.amount,
            file: { name, buffer: await oblio.downloadPdf(slotDocument) },
            document: slotDocument
          });
        }

        if (uploads.length) {
          await transactionsPage.attachEInvoices(uploads);
          for (const { document: uploadedDocument } of uploads) {
            unused.delete(uploadedDocument);
          }
          attached.push(
            `${transaction.category} ${transaction.amount} <- ` +
              uploads
                .map(
                  ({ amount, document: uploadedDocument }) =>
                    `${amount.toFixed(2)} ${transaction.currency}: ${uploadedDocument.supplier} ${uploadedDocument.number}`
                )
                .join(" + ")
          );
        } else {
          await transactionsPage.closeEdit();
          if (!selected.size) unmatched.push(transaction);
        }
        continue;
      }

      const invoiceState = await transactionsPage.getEInvoiceState();
      if (invoiceState === "attached") {
        unused.delete(document);
        skipped.push(`${transaction.category} ${transaction.amount} (already has eFactura)`);
        await transactionsPage.closeEdit();
        continue;
      }
      if (invoiceState === "unavailable") {
        const warning =
          `${transaction.date.toLocaleDateString("ro-RO")} ${transaction.category} ` +
          `${transaction.amount.toFixed(2)} ${transaction.currency}: eFactura upload is unavailable; ` +
          `Oblio ${document.supplier} ${document.number} was not attached.`;
        console.warn(`WARNING: ${warning}`);
        test.info().annotations.push({ type: "warning", description: warning });
        skipped.push(warning);
        await transactionsPage.closeEdit();
        continue;
      }

      const name = `${document.number.replace(/[^\w.-]+/g, "_")}.pdf`;
      await transactionsPage.attachEInvoice({ name, buffer: await oblio.downloadPdf(document) });
      unused.delete(document);
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
