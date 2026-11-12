import { Page, Locator, Response, expect } from "@playwright/test";
import { parseRoDate } from "../oblio/OblioPage";

export interface Transaction {
  date: Date;
  type: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  rowText: string;
  rowIndex: number;
}

interface Period {
  year: number;
  month: number;
}

const MONTHS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie"
];

export class TransactionsPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly periodSelector: Locator;
  readonly emptyMessage: Locator;
  readonly loadMoreButton: Locator;
  readonly editButton: Locator;
  readonly dialog: Locator;
  readonly eInvoiceCard: Locator;
  readonly eInvoiceInput: Locator;
  readonly saveButton: Locator;
  private period: Period | null = null;
  private pageReady = false;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator("tbody tr.MuiTableRow-root");
    this.periodSelector = page.getByRole("combobox", { name: "Perioada" });
    this.emptyMessage = page.getByText("Nu există tranzacții pentru criteriile curente.", { exact: true });
    this.loadMoreButton = page.getByRole("button", { name: "Încarcă mai multe", exact: true });
    this.editButton = page.getByRole("button", { name: "Editează" });
    this.dialog = page.getByRole("dialog");
    this.eInvoiceCard = this.dialog.getByRole("group", { name: "eFactură" });
    this.eInvoiceInput = this.dialog.getByLabel("Fișier: eFactură");
    this.saveButton = this.dialog.getByRole("button", { name: "Salvează" });
  }

  async goTo() {
    const targetPeriod = this.period;
    const currentPeriod = { year: new Date().getFullYear(), month: new Date().getMonth() };
    const responsePromise = this.waitForTransactionsResponse(currentPeriod);
    this.pageReady = false;
    await this.page.goto("http://localhost:5173/transactions");
    await expect(this.periodSelector).toBeVisible();
    const response = await responsePromise;
    const hasTransactions = await this.responseHasTransactions(response, currentPeriod);
    this.period = currentPeriod;
    await this.waitForPeriodContent(currentPeriod, hasTransactions);
    this.pageReady = true;
    if (targetPeriod && !this.isSamePeriod(targetPeriod, currentPeriod)) {
      await this.selectPeriod(targetPeriod);
    }
  }

  async selectPeriod(period: Period) {
    if (this.period && this.isSamePeriod(this.period, period)) {
      return;
    }

    const responsePromise = this.waitForTransactionsResponse(period);

    await this.periodSelector.click();
    await this.page.getByRole("option", { name: `${MONTHS[period.month]} ${period.year}`, exact: true }).click();
    const response = await responsePromise;
    const hasTransactions = await this.responseHasTransactions(response, period);
    this.period = period;
    await this.waitForPeriodContent(period, hasTransactions);
  }

  private isSamePeriod(left: Period, right: Period) {
    return left.year === right.year && left.month === right.month;
  }

  private waitForTransactionsResponse(period: Period) {
    const from = `${period.year}-${String(period.month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(period.year, period.month + 1, 0)).getUTCDate();
    const to = `${period.year}-${String(period.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return this.page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname.endsWith("/transactions")
        && url.searchParams.get("dateFrom") === from
        && url.searchParams.get("dateTo") === to;
    }, { timeout: 30_000 });
  }

  private async responseHasTransactions(response: Response, period: Period) {
    expect(response.ok(), `Transactions for ${MONTHS[period.month]} ${period.year}`).toBeTruthy();
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || !("content" in payload) || !Array.isArray(payload.content)) {
      throw new Error(`Unexpected transaction response for ${MONTHS[period.month]} ${period.year}`);
    }
    return payload.content.length > 0;
  }

  private async waitForPeriodContent(period: Period, hasTransactions: boolean) {
    await expect.poll(async () => {
      if (!hasTransactions) {
        return (await this.rows.count()) === 0 && await this.emptyMessage.isVisible();
      }
      const row = this.rows.first();
      if (!(await row.count())) return false;
      const date = parseRoDate(await row.locator("td").nth(1).innerText());
      return date.getFullYear() === period.year && date.getMonth() === period.month;
    }, {
      message: `Transactions for ${MONTHS[period.month]} ${period.year} did not load`,
      timeout: 30_000
    }).toBe(true);
  }

  private async loadAllRows() {
    while (await this.loadMoreButton.count()) {
      const loaded = await this.rows.count();
      await this.loadMoreButton.click();
      await expect.poll(() => this.rows.count(), { timeout: 30_000 }).toBeGreaterThan(loaded);
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.loadAllRows();
    const result: Transaction[] = [];
    for (const [rowIndex, row] of (await this.rows.all()).entries()) {
      const cells = row.locator("td");
      const [amount, currency] = (await cells.nth(8).innerText()).trim().split(/\s+/);
      result.push({
        date: parseRoDate(await cells.nth(1).innerText()),
        type: (await cells.nth(2).innerText()).trim(),
        category: (await cells.nth(4).innerText()).trim(),
        description: (await cells.nth(6).innerText()).trim(),
        amount: Math.abs(Number(amount.replace(/\./g, "").replace(",", "."))),
        currency,
        rowText: (await row.innerText()).replace(/\s+/g, " "),
        rowIndex
      });
    }
    return result;
  }

  async openEdit(transaction: Transaction) {
    if (!this.pageReady) await this.goTo();
    const transactionPeriod = {
      year: transaction.date.getFullYear(),
      month: transaction.date.getMonth()
    };
    if (!this.period || !this.isSamePeriod(this.period, transactionPeriod)) {
      await this.selectPeriod(transactionPeriod);
    }
    await this.loadAllRows();
    const row = this.rows.nth(transaction.rowIndex);
    if (!(await row.count())) {
      throw new Error(`Transaction row not found: ${transaction.rowText}`);
    }
    const rowDate = parseRoDate(await row.locator("td").nth(1).innerText());
    const rowType = (await row.locator("td").nth(2).innerText()).trim();
    const rowCategory = (await row.locator("td").nth(4).innerText()).trim();
    const rowDescription = (await row.locator("td").nth(6).innerText()).trim();
    const [amount, currency] = (await row.locator("td").nth(8).innerText()).trim().split(/\s+/);
    const rowAmount = Math.abs(Number(amount.replace(/\./g, "").replace(",", ".")));
    if (
      rowDate.getTime() !== transaction.date.getTime()
      || rowType !== transaction.type
      || rowCategory !== transaction.category
      || rowDescription !== transaction.description
      || rowAmount !== transaction.amount
      || currency !== transaction.currency
    ) {
      throw new Error(`Transaction row no longer matches: ${transaction.rowText}`);
    }
    await row.click();
    await this.editButton.click();
    await expect(this.dialog).toBeVisible();
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
