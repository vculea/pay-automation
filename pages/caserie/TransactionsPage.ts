import { Page, Locator, expect } from "@playwright/test";
import { parseRoDate } from "../oblio/OblioPage";

export interface Transaction {
  date: Date;
  category: string;
  description: string;
  amount: number;
  currency: string;
  rowText: string;
}

export class TransactionsPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly editButton: Locator;
  readonly dialog: Locator;
  readonly eInvoiceCard: Locator;
  readonly eInvoiceInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator("tbody tr.MuiTableRow-root");
    this.editButton = page.getByRole("button", { name: "Editează" });
    this.dialog = page.getByRole("dialog");
    this.eInvoiceCard = this.dialog.getByRole("group", { name: "eFactură" });
    this.eInvoiceInput = this.dialog.getByLabel("Fișier: eFactură");
    this.saveButton = this.dialog.getByRole("button", { name: "Salvează" });
  }

  async goTo() {
    await this.page.goto("http://localhost:5173/transactions");
    await this.rows.first().waitFor();
  }

  async getTransactions(): Promise<Transaction[]> {
    const result: Transaction[] = [];
    for (const row of await this.rows.all()) {
      const cells = row.locator("td");
      const [amount, currency] = (await cells.nth(8).innerText()).trim().split(/\s+/);
      result.push({
        date: parseRoDate(await cells.nth(1).innerText()),
        category: (await cells.nth(4).innerText()).trim(),
        description: (await cells.nth(6).innerText()).trim(),
        amount: Math.abs(Number(amount.replace(/\./g, "").replace(",", "."))),
        currency,
        rowText: (await row.innerText()).replace(/\s+/g, " ")
      });
    }
    return result;
  }

  async openEdit(transaction: Transaction) {
    await this.goTo();
    for (const row of await this.rows.all()) {
      if ((await row.innerText()).replace(/\s+/g, " ") === transaction.rowText) {
        await row.click();
        await this.editButton.click();
        await expect(this.dialog).toBeVisible();
        return;
      }
    }
    throw new Error(`Transaction row not found: ${transaction.rowText}`);
  }

  async hasEInvoice(): Promise<boolean> {
    await expect(this.eInvoiceCard).toBeVisible();
    return (await this.eInvoiceCard.getByTestId("file-drop-zone").count()) === 0;
  }

  async attachEInvoice(file: { name: string; buffer: Buffer }) {
    await this.eInvoiceInput.setInputFiles({ name: file.name, mimeType: "application/pdf", buffer: file.buffer });
    await expect(this.eInvoiceCard.getByText(file.name)).toBeVisible();
    await this.saveButton.click();
    await expect(this.dialog).toBeHidden({ timeout: 60_000 });
  }
}
