import { existsSync } from "node:fs";
import { join } from "node:path";
import { Page, Locator, expect } from "@playwright/test";
import { caserieUrl } from "../../setup/caserieAuth";
import { TransactionsPage } from "./TransactionsPage";

export class CaseriePage {
  readonly page: Page;
  readonly main: Locator;
  readonly loginButton: Locator;
  readonly addTransactionButton: Locator;
  readonly amountInput: Locator;
  readonly transactionDateInput: Locator;
  readonly descriptionInput: Locator;
  readonly transactions: TransactionsPage;
  readonly facturaPath = "C:\\Users\\vculea\\OneDrive - RWS\\Desktop\\Biserica\\2026\\Plati\\Facturi";

  constructor(page: Page) {
    this.page = page;

    this.main = page.getByRole("main");
    this.loginButton = page.getByRole("button", { name: "Continuă cu Google" });
    this.addTransactionButton = page.getByRole("button", { name: "Adaugă tranzacție", exact: true });
    this.amountInput = page.getByRole("textbox", { name: "Sumă", exact: true });
    this.transactionDateInput = page.getByRole("textbox", { name: "Data tranzacției", exact: true });
    this.descriptionInput = page.getByRole("textbox", { name: "Descriere", exact: true });

    this.transactions = new TransactionsPage(this.page);
  }

  async goTo() {
    await this.page.goto(caserieUrl);
  }

  async login() {
    await this.goTo();
    await this.expectAuthenticated();
  }

  async expectAuthenticated(timeout = 15_000) {
    await expect(this.main).toBeVisible({ timeout });
    await expect(this.page, "Caserie must open an authenticated route, not the Google login page").toHaveURL(
      url => url.origin === new URL(caserieUrl).origin && url.pathname !== "/login",
      { timeout }
    );
    await expect(this.loginButton).toBeHidden();
  }

  async addEntry(data: {
    type: string;
    cont: string;
    price: string;
    date: string;
    category: string;
    contact: string;
    description: string;
    typeDocument: string;
    factura: string;
  }) {
    const date = this.parseEntryDate(data.date);
    const amount = Number(data.price.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid transaction amount: ${data.price}`);
    }

    const filePath = join(this.facturaPath, data.factura);
    if (!existsSync(filePath)) {
      throw new Error(`Invoice file does not exist: ${filePath}`);
    }

    await this.transactions.goTo();
    await this.addTransactionButton.click();
    await expect(this.transactions.dialog).toBeVisible();
    await this.selectMuiOption("Tip tranzacție", data.type);
    await this.selectMuiOption("Cont", data.cont);
    await this.amountInput.fill(data.price);
    await this.transactionDateInput.fill(this.toIsoDate(date));
    await this.pickAutocomplete("Categorie", data.category);
    if (data.contact) await this.pickAutocomplete("Contact (opțional)", data.contact);
    await this.descriptionInput.fill(data.description);

    const attachments = this.transactions.attachments;
    await this.selectMuiOption("Tip document", data.typeDocument, attachments);
    const invoiceAmountLabel = data.typeDocument === "Factură" ? "Suma facturii 1" : `Suma ${data.typeDocument} 1`;
    await this.page.getByRole("textbox", { name: invoiceAmountLabel, exact: true }).fill(data.price);
    const fileInput = attachments
      .getByRole("group", { name: `${data.typeDocument} 1`, exact: true })
      .locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    const savedMessage = expect(this.page.getByText("Tranzacția a fost salvată.", { exact: true })).toBeVisible({
      timeout: 60_000
    });
    const dialogClosed = expect(this.transactions.dialog).toBeHidden({ timeout: 60_000 });
    await this.transactions.saveButton.click();
    await Promise.all([savedMessage, dialogClosed]);
  }

  private parseEntryDate(value: string) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) throw new Error(`Expected transaction date in DD/MM/YYYY format, received: ${value}`);

    const [, dayText, monthText, yearText] = match;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error(`Invalid transaction date: ${value}`);
    }
    return date;
  }

  private toIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  private async selectMuiOption(label: string, value: string, scope: Page | Locator = this.page) {
    await scope.getByRole("combobox", { name: label, exact: true }).click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }

  private async pickAutocomplete(label: string, value: string) {
    await this.page.getByRole("combobox", { name: label, exact: true }).fill(value);
    const optionName = new RegExp(`(?:›\\s*)?${this.escapeRegExp(value)}$`);
    await this.page.getByRole("option", { name: optionName }).click();
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
