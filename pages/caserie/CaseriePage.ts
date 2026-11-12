import { Page, Locator, expect } from "@playwright/test";
import { caserieUrl } from "../../setup/caserieAuth";

export class CaseriePage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly amountEl: Locator;
  readonly transferInternal: Locator;
  readonly valueInput: Locator;
  readonly nextButton: Locator;
  readonly transferaButton: Locator;
  readonly goToPaymentsLink: Locator;
  readonly homeEl: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("#user");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.getByRole("button", { name: "Continuă cu Google" });
    this.amountEl = page.locator(".amount");
    this.transferInternal = page.locator("#transferInternalBtn");
    this.valueInput = page.locator("#sourceAccountValueInput");
    this.nextButton = page.getByRole("button", { name: "Mergi mai departe" });
    this.transferaButton = page.getByRole("button", { name: "Transferă" });
    this.goToPaymentsLink = page.getByRole("link", { name: "Mergi la plăți" });
    this.homeEl = page.getByRole("heading", { name: "Acasă" });
  }

  async goTo() {
    await this.page.goto(caserieUrl);
  }

  async login() {
    await this.goTo();
    await this.expectAuthenticated();
  }

  async expectAuthenticated(timeout = 15_000) {
    await expect(this.page.getByRole("main")).toBeVisible({ timeout });
    await expect(this.page, "Caserie must open an authenticated route, not the Google login page").toHaveURL(
      url => url.origin === new URL(caserieUrl).origin && url.pathname !== "/login",
      { timeout }
    );
    await expect(this.loginButton).toBeHidden();
  }

  async getCurrentValue() {
    return await this.amountEl.first().textContent();
  }
}
