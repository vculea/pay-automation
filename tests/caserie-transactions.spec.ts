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
  expect(transactions.map(transaction => transaction.eInvoiceStatus)).toEqual(["Da", "Nu", "—"]);
  expect(transactions.map(transaction => transaction.amount)).toEqual([513.6, 513.6, 513.6]);
});

for (const scenario of ["active storno", "editable", "unexpectedly disabled"] as const) {
  test(`opening a transaction: ${scenario}`, async ({ page }) => {
    const now = new Date();
    const date = `01.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
    const reason = "Tranzacția are storno active; modifică sau șterge mai întâi stornourile.";
    await page.route("http://localhost:5173/api/transactions?*", route =>
      route.fulfill({ json: { content: [{}] } })
    );
    await page.route("http://localhost:5173/transactions", route =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <select aria-label="Perioada"><option>Current month</option></select>
          <p>Încărcate 1 din 1</p>
          <table><tbody>
            <tr class="MuiTableRow-root" onclick="
              const button = document.querySelector('button');
              button.disabled = ${scenario !== "editable"};
              button.setAttribute('aria-description', '${scenario === "unexpectedly disabled" ? "Unknown restriction" : reason}');
            ">
              <td></td><td>${date}</td><td>Cheltuială</td><td>Cont</td><td>Copii</td>
              <td></td><td>Descriere</td><td></td><td>Nu</td><td>-513,60 RON</td>
            </tr>
          </tbody></table>
          <button disabled onclick="document.querySelector('[role=dialog]').hidden = false">Editează</button>
          <div role="dialog" hidden>Edit transaction</div>
          <script>
            const date = new Date();
            const from = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-01';
            const to = from.slice(0, 8) + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            fetch('/api/transactions?dateFrom=' + from + '&dateTo=' + to);
          </script>
        `
      })
    );
    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goTo();
    const [transaction] = await transactionsPage.getTransactions();
    if (scenario === "unexpectedly disabled") {
      page.setDefaultTimeout(500);
      await expect(transactionsPage.openEdit(transaction)).rejects.toThrow(/element is not enabled/);
      await expect(transactionsPage.dialog).toBeHidden();
    } else if (scenario === "active storno") {
      expect(await transactionsPage.openEdit(transaction)).toEqual({ status: "blocked", reason });
      await expect(transactionsPage.dialog).toBeHidden();
      await expect(transactionsPage.editButton).toBeDisabled();
    } else {
      expect(await transactionsPage.openEdit(transaction)).toEqual({ status: "opened" });
      await expect(transactionsPage.dialog).toBeVisible();
    }
  });
}

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

test("reads amounts and eFactura availability for every invoice slot", async ({ page }) => {
  await page.setContent(`
    <div role="dialog">
      <label for="amount1">Suma facturii 1</label><input id="amount1" value="1.234,56">
      <label for="amount2">Suma facturii 2</label><input id="amount2" value="513,60">
      <section role="group" aria-label="Documente atașate și chitanță">
        <section role="group" aria-label="Factură 1">
          <ul role="list" aria-label="eFactură 1"><li>stored.pdf</li></ul>
        </section>
        <section role="group" aria-label="Factură 2">
          <input type="file" aria-label="Fișier: eFactură 2">
        </section>
      </section>
    </div>
  `);
  const slots = await new TransactionsPage(page).getInvoiceSlots();
  expect(slots).toEqual([
    { index: 1, amount: 1234.56, eInvoiceStored: true, eInvoiceUploadable: false },
    { index: 2, amount: 513.6, eInvoiceStored: false, eInvoiceUploadable: true }
  ]);
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

test("uploads eFacturi to their invoice slots and saves once", async ({ page }) => {
  let uploadCount = 0;
  await page.route("https://caserie.test/", route => route.fulfill({ contentType: "text/html", body: "<html></html>" }));
  await page.route("https://caserie.test/documents", route => {
    uploadCount += 1;
    return route.fulfill({ json: { storedFileName: `EFactura${uploadCount}.pdf`, type: "EFACTURA" } });
  });
  await page.goto("https://caserie.test/");
  await page.setContent(`
    <div role="dialog">
      <section role="group" aria-label="Documente atașate și chitanță">
        <section role="group" aria-label="eFactură 1">
          <input type="file" aria-label="Fișier: eFactură 1">
        </section>
        <section role="group" aria-label="eFactură 2">
          <input type="file" aria-label="Fișier: eFactură 2">
        </section>
      </section>
      <button onclick="document.body.dataset.saved = String(Number(document.body.dataset.saved || 0) + 1); this.closest('[role=dialog]').remove()">
        Salvează
      </button>
    </div>
  `);
  await page.locator('input[type="file"]').evaluateAll(inputs => {
    inputs.forEach(input => {
      input.addEventListener("change", async () => {
        const response = await fetch("/documents", { method: "POST" });
        const document = await response.json();
        const list = window.document.createElement("ul");
        list.setAttribute("role", "list");
        list.setAttribute("aria-label", input.getAttribute("aria-label")!.replace("Fișier: ", ""));
        const item = window.document.createElement("li");
        item.textContent = document.storedFileName;
        list.append(item);
        input.parentElement!.replaceWith(list);
      });
    });
  });

  const transactions = new TransactionsPage(page);
  await transactions.attachEInvoices([
    { slot: 2, file: { name: "invoice-2.pdf", buffer: Buffer.from("%PDF-test-2") } },
    { slot: 1, file: { name: "invoice-1.pdf", buffer: Buffer.from("%PDF-test-1") } }
  ]);
  expect(uploadCount).toBe(2);
  await expect(page.locator("body")).toHaveAttribute("data-saved", "1");
  await expect(transactions.dialog).toBeHidden();
});
