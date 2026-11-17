import { Page, Locator, Response, expect } from "@playwright/test";
import { parseRoDate } from "../oblio/OblioPage";

export interface Transaction {
  date: Date;
  type: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  hasEInvoice: boolean;
  eInvoiceStatus: "Da" | "Nu" | "—";
  rowText: string;
  rowIndex: number;
}

export interface InvoiceSlot {
  index: number;
  amount: number;
  eInvoiceStored: boolean;
  eInvoiceUploadable: boolean;
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
  readonly loadingProgress: Locator;
  readonly editButton: Locator;
  readonly dialog: Locator;
  readonly attachments: Locator;
  readonly eInvoiceList: Locator;
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
    this.loadingProgress = page.getByText(/Încărcate\s+\d+\s+din\s+\d+/).first();
    this.editButton = page.getByRole("button", { name: "Editează" });
    this.dialog = page.getByRole("dialog");
    this.attachments = this.dialog.getByRole("group", { name: "Documente atașate și chitanță", exact: true });
    // Invoices are paired per row ("Factură N" / "eFactură N"); a stored eFactură renders as list "eFactură N".
    this.eInvoiceList = this.attachments.getByRole("list", { name: /^eFactură \d+$/ });
    this.eInvoiceInput = this.attachments.getByLabel(/^Fișier: eFactură \d+$/).first();
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
    return this.page.waitForResponse(
      response => {
        const url = new URL(response.url());
        return (
          url.pathname.endsWith("/transactions") &&
          url.searchParams.get("dateFrom") === from &&
          url.searchParams.get("dateTo") === to
        );
      },
      { timeout: 30_000 }
    );
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
    await expect
      .poll(
        async () => {
          if (!hasTransactions) {
            return (await this.rows.count()) === 0 && (await this.emptyMessage.isVisible());
          }
          const row = this.rows.first();
          if (!(await row.count())) return false;
          const date = parseRoDate(await row.locator("td").nth(1).innerText());
          return date.getFullYear() === period.year && date.getMonth() === period.month;
        },
        {
          message: `Transactions for ${MONTHS[period.month]} ${period.year} did not load`,
          timeout: 30_000
        }
      )
      .toBe(true);
  }

  private async loadAllRows() {
    if (await this.emptyMessage.isVisible()) return;

    const getProgress = async () => {
      const text = await this.loadingProgress.innerText({ timeout: 15_000 });
      const match = text.match(/Încărcate\s+(\d+)\s+din\s+(\d+)/);
      if (!match) throw new Error(`Unexpected transaction loading progress: ${text}`);
      return { loaded: Number(match[1]), total: Number(match[2]) };
    };

    let progress = await getProgress();
    while (progress.loaded < progress.total) {
      const previous = progress.loaded;
      await expect
        .poll(
          async () => {
            const current = await getProgress();
            return current.loaded > previous || (await this.loadMoreButton.isEnabled());
          },
          { timeout: 15_000, message: "Transactions did not finish loading or become ready to load more" }
        )
        .toBe(true);

      progress = await getProgress();
      if (progress.loaded > previous) continue;

      try {
        await this.loadMoreButton.click({ timeout: 5_000 });
      } catch (error) {
        // The table can load automatically while Playwright is trying to click.
        progress = await getProgress();
        if (progress.loaded <= previous) throw error;
        continue;
      }

      await expect
        .poll(async () => (await getProgress()).loaded, {
          timeout: 15_000,
          message: "Loading more transactions made no progress"
        })
        .toBeGreaterThan(previous);
      progress = await getProgress();
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.loadAllRows();
    const result: Transaction[] = [];
    for (const [rowIndex, row] of (await this.rows.all()).entries()) {
      result.push({
        ...(await this.readRow(row)),
        rowText: (await row.innerText()).replace(/\s+/g, " "),
        rowIndex
      });
    }
    return result;
  }

  private async readRow(row: Locator): Promise<Omit<Transaction, "rowText" | "rowIndex">> {
    const cells = row.locator("td");
    const [amount, currency] = (await cells.nth(9).innerText()).trim().split(/\s+/);
    const invoiceStatus = (await cells.nth(8).innerText()).trim();
    if (invoiceStatus !== "Da" && invoiceStatus !== "Nu" && invoiceStatus !== "—") {
      throw new Error(`Unexpected eFactura grid status: ${invoiceStatus}`);
    }
    return {
      date: parseRoDate(await cells.nth(1).innerText()),
      type: (await cells.nth(2).innerText()).trim(),
      category: (await cells.nth(4).innerText()).trim(),
      description: (await cells.nth(6).innerText()).trim(),
      amount: Math.abs(Number(amount.replace(/\./g, "").replace(",", "."))),
      currency,
      hasEInvoice: invoiceStatus === "Da",
      eInvoiceStatus: invoiceStatus
    };
  }

  async openEdit(transaction: Transaction): Promise<{ status: "opened" } | { status: "blocked"; reason: string }> {
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
    const current = await this.readRow(row);
    if (
      current.date.getTime() !== transaction.date.getTime() ||
      current.type !== transaction.type ||
      current.category !== transaction.category ||
      current.description !== transaction.description ||
      current.amount !== transaction.amount ||
      current.currency !== transaction.currency
    ) {
      throw new Error(`Transaction row no longer matches: ${transaction.rowText}`);
    }
    await row.click();
    const reason = await this.editButton.getAttribute("aria-description");
    if (
      (await this.editButton.isDisabled()) &&
      reason === "Tranzacția are storno active; modifică sau șterge mai întâi stornourile."
    ) {
      return { status: "blocked", reason };
    }
    await this.editButton.click();
    await expect(this.dialog).toBeVisible();
    return { status: "opened" };
  }

  async getEInvoiceState(): Promise<"attached" | "available" | "unavailable"> {
    // Linked attachment groups render only after the stored documents have loaded.
    await expect(this.attachments.getByRole("group").first()).toBeVisible({ timeout: 30_000 });
    const storedInvoices = this.attachments.getByRole("listitem").filter({ hasText: /eFactură\s*·/ });
    if (await storedInvoices.count()) return "attached";
    return (await this.eInvoiceInput.count()) > 0 ? "available" : "unavailable";
  }

  async closeEdit() {
    await this.dialog.getByRole("button", { name: "Anulează", exact: true }).click();
    await expect(this.dialog).toBeHidden();
  }

  async getInvoiceSlots(): Promise<InvoiceSlot[]> {
    // Linked attachment groups render only after the stored documents have loaded.
    await expect(this.attachments.getByRole("group").first()).toBeVisible({ timeout: 30_000 });
    const slots: InvoiceSlot[] = [];
    for (const textbox of await this.dialog.getByRole("textbox", { name: /^Suma facturii \d+$/ }).all()) {
      const label = await textbox.evaluate(
        el => el.getAttribute("aria-label") ?? (el instanceof HTMLInputElement ? el.labels?.[0]?.textContent : null) ?? ""
      );
      const index = Number(label.match(/Suma facturii (\d+)/)?.[1]);
      const raw = (await textbox.inputValue()).trim();
      const amount = this.parseAmount(raw);
      if (!Number.isInteger(index) || Number.isNaN(amount)) {
        throw new Error(`Cannot read invoice slot "${label}" with amount "${raw}"`);
      }
      slots.push({
        index,
        amount,
        eInvoiceStored:
          (await this.attachments
            .getByRole("list", { name: `eFactură ${index}`, exact: true })
            .getByRole("listitem")
            .count()) > 0,
        eInvoiceUploadable: (await this.attachments.getByLabel(`Fișier: eFactură ${index}`, { exact: true }).count()) > 0
      });
    }
    return slots;
  }

  private parseAmount(raw: string) {
    let text = raw.replace(/[^\d.,-]/g, "");
    if (!text) return Number.NaN;
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
      if (text.split(".").length > 2) text = text.replace(/\./g, "");
    }
    return Number(text);
  }

  private async uploadEInvoice(file: { name: string; buffer: Buffer }, slot?: number) {
    const input =
      slot === undefined
        ? this.eInvoiceInput
        : this.attachments.getByLabel(`Fișier: eFactură ${slot}`, { exact: true });
    const list =
      slot === undefined
        ? this.eInvoiceList
        : this.attachments.getByRole("list", { name: `eFactură ${slot}`, exact: true });
    const uploaded = this.page.waitForResponse(
      response => new URL(response.url()).pathname.endsWith("/documents") && response.request().method() === "POST",
      { timeout: 60_000 }
    );
    await input.setInputFiles({ name: file.name, mimeType: "application/pdf", buffer: file.buffer });
    const response = await uploaded;
    expect(response.ok(), `Uploading Oblio PDF ${file.name}: HTTP ${response.status()}`).toBeTruthy();
    const document: unknown = await response.json();
    if (
      typeof document !== "object" ||
      document === null ||
      !("storedFileName" in document) ||
      typeof document.storedFileName !== "string" ||
      !document.storedFileName ||
      !("type" in document) ||
      document.type !== "EFACTURA"
    ) {
      throw new Error(`Unexpected eFactura upload response for ${file.name}`);
    }
    // Caserie assigns its own filename; wait for that document, not the selected filename.
    await expect(list.getByRole("listitem").getByText(document.storedFileName, { exact: true })).toBeVisible({
      timeout: 60_000
    });
  }

  private async saveEdit() {
    await this.saveButton.click();
    await expect(this.dialog).toBeHidden({ timeout: 60_000 });
  }

  async attachEInvoice(file: { name: string; buffer: Buffer }) {
    await this.uploadEInvoice(file);
    await this.saveEdit();
  }

  async attachEInvoices(files: { slot: number; file: { name: string; buffer: Buffer } }[]) {
    if (!files.length) {
      throw new Error("Cannot save eFacturi when no invoice files were provided.");
    }
    for (const { slot, file } of files) {
      await this.uploadEInvoice(file, slot);
    }
    await this.saveEdit();
  }
}
