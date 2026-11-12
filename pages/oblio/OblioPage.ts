import { Page, Locator, expect } from "@playwright/test";

export interface OblioDocument {
  supplier: string;
  number: string;
  documentDate: Date;
  receivedDate: Date;
  amount: number;
  currency: string;
  url: string;
}

export function parseRoDate(text: string): Date {
  const [day, month, year] = text.trim().split(".").map(Number);
  return new Date(year, month - 1, day);
}

export class OblioPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly cookieConsentButton: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("#username");
    this.passwordInput = page.locator("#password");
    this.cookieConsentButton = page.getByRole("button", { name: "Ok, accepta toate", exact: true });
    this.loginButton = page.getByRole("button", { name: "Intra in cont" });
  }

  async goTo() {
    await this.page.goto("https://www.oblio.eu/report/wallet");
  }

  async getDocuments(oldestDate: Date): Promise<OblioDocument[]> {
    const rows = this.page.locator("#content-table tr.table_row");
    const documents: OblioDocument[] = [];
    for (let pageNo = 1; ; pageNo++) {
      await rows.first().waitFor();
      for (const row of await rows.all()) {
        const cells = row.locator("td");
        const link = cells.nth(1).locator("a").first();
        const value = (await cells.nth(3).innerText()).trim();
        const [amount, currency] = value.split(/\s+/);
        documents.push({
          supplier: (await cells.nth(0).locator("a").first().innerText()).trim(),
          number: (await link.innerText()).trim(),
          documentDate: parseRoDate(await cells.nth(1).locator("p.text-sm").innerText()),
          receivedDate: parseRoDate(await cells.nth(2).innerText()),
          amount: Number(amount),
          currency,
          url: (await link.getAttribute("href")) ?? ""
        });
      }
      const oldest = Math.min(...documents.map(d => d.receivedDate.getTime()));
      const next = this.page.locator(".pagination a.page-link", { hasText: new RegExp(`^${pageNo + 1}$`) }).first();
      if (oldest < oldestDate.getTime() || !(await next.count())) break;
      await next.click();
      await expect(this.page.locator(".pagination .active")).toHaveText(String(pageNo + 1));
    }
    return documents;
  }

  async downloadPdf(document: OblioDocument): Promise<Buffer> {
    const response = await this.page.context().request.get(document.url);
    expect(response.ok(), `Oblio PDF for ${document.number}`).toBeTruthy();
    return await response.body();
  }

  async login(credentials: any) {
    await this.goTo();
    try {
      await this.cookieConsentButton.waitFor({ state: "visible", timeout: 10_000 });
      await this.cookieConsentButton.click();
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "TimeoutError") {
        throw error;
      }
    }
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(credentials.oblio.email);
    await this.passwordInput.fill(credentials.oblio.password);
    await this.loginButton.click();
  }
}
