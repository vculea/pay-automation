import { expect, test } from "@playwright/test";
import { TransactionsPage } from "../pages/caserie/TransactionsPage";

test.use({ headless: true });

test("reads existing eFactura status from the transaction grid", async ({ page }) => {
  await page.setContent(`
    <p>Încărcate 3 din 3</p>
    <table><tbody>
      ${["Da", "Nu", "—"].map(status => `
        <tr class="MuiTableRow-root">
          <td></td><td>09.11.2026</td><td>Cheltuială</td><td>Cont</td><td>Copii</td>
          <td></td><td>Descriere</td><td></td><td>${status}</td><td>-513,60 RON</td>
        </tr>
      `).join("")}
    </tbody></table>
  `);
  const transactions = await new TransactionsPage(page).getTransactions();
  expect(transactions.map(transaction => transaction.hasEInvoice)).toEqual([true, false, false]);
  expect(transactions.map(transaction => transaction.amount)).toEqual([513.6, 513.6, 513.6]);
});

const cases = [
  {
    name: "empty upload zone",
    markup: '<section role="group" aria-label="eFactură 1"><input type="file" aria-label="Fișier: eFactură 1"></section>',
    state: "available"
  },
  {
    name: "stored invoice in renamed zone",
    markup: '<section role="group" aria-label="Zonă de atașare: eFactură"><ul><li>invoice.pdf eFactură · Mărime: 12 KB</li></ul></section>',
    state: "attached"
  },
  {
    name: "legacy invoice in other attachments",
    markup: '<section role="group" aria-label="Alte documente atașate"><ul><li>invoice.pdf eFactură · Mărime: 12 KB</li></ul></section>',
    state: "attached"
  },
  {
    name: "category without an invoice zone",
    markup: '<section role="group" aria-label="Zonă de atașare: Document principal"><ul><li>invoice.pdf Factură · Mărime: 12 KB</li></ul></section>',
    state: "unavailable"
  }
] as const;

for (const scenario of cases) {
  test(`eFactura state: ${scenario.name}`, async ({ page }) => {
    await page.setContent(`
      <div role="dialog">
        <section role="group" aria-label="Documente atașate și chitanță">${scenario.markup}</section>
      </div>
    `);
    expect(await new TransactionsPage(page).getEInvoiceState()).toBe(scenario.state);
  });
}

test("eFactura state waits for stored documents before deciding", async ({ page }) => {
  await page.setContent(`
    <div role="dialog">
      <section role="group" aria-label="Documente atașate și chitanță">
        <div role="status">Loading documents</div>
      </section>
    </div>
  `);
  const state = new TransactionsPage(page).getEInvoiceState();
  await page.getByRole("status").evaluate(element => {
    element.outerHTML =
      '<section role="group" aria-label="Alte documente atașate"><ul><li>invoice.pdf eFactură · Mărime: 12 KB</li></ul></section>';
  });
  expect(await state).toBe("attached");
});

test("upload waits for the server-assigned filename before saving", async ({ page }) => {
  await page.route("https://caserie.test/", route => route.fulfill({ contentType: "text/html", body: "<html></html>" }));
  await page.route("https://caserie.test/documents", route =>
    route.fulfill({ json: { storedFileName: "EFactura71.pdf", type: "EFACTURA" } })
  );
  await page.goto("https://caserie.test/");
  await page.setContent(`
    <div role="dialog">
      <section role="group" aria-label="Documente atașate și chitanță">
        <section role="group" aria-label="eFactură 1">
          <input type="file" aria-label="Fișier: eFactură 1">
        </section>
      </section>
      <button onclick="this.closest('[role=dialog]').remove()">Salvează</button>
    </div>
  `);
  await page.locator("input").evaluate(input => {
    input.addEventListener("change", async () => {
      const response = await fetch("/documents", { method: "POST" });
      const document = await response.json();
      // A stored eFactură replaces its upload zone with list "eFactură N".
      const list = window.document.createElement("ul");
      list.setAttribute("aria-label", "eFactură 1");
      const item = window.document.createElement("li");
      item.textContent = document.storedFileName;
      list.append(item);
      input.parentElement!.replaceWith(list);
    });
  });
  const transactions = new TransactionsPage(page);
  await transactions.attachEInvoice({ name: "original.pdf", buffer: Buffer.from("%PDF-test") });
  await expect(transactions.dialog).toBeHidden();
});
