import {expect, type Locator, type Page} from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;        

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.locator('#user');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.getByText('Autentifică-te');
    }  

    async goto() {
        await this.page.goto('https://goapp.bancatransilvania.ro/app/auth/login');
    }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }   
}