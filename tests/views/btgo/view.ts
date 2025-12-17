import { Page, Locator } from '@playwright/test';

export class ViewPage {
  readonly page: Page;
  readonly amountEl: Locator;    
  readonly transferInternal: Locator;  
  readonly valueInput: Locator; 
  readonly nextButton: Locator; 
  readonly transferaButton: Locator;
  readonly goToPaymentsLink: Locator;
  readonly homeEl: Locator;

    constructor(page: Page) {
        this.page = page;
        this.amountEl = page.locator('.amount');
        this.transferInternal = page.locator('#transferInternalBtn');
        this.valueInput = page.locator('#sourceAccountValueInput');
        this.nextButton = page.getByRole('button', { name: 'Mergi mai departe' });
        this.transferaButton = page.getByRole('button', { name: 'Transferă' });
        this.goToPaymentsLink = page.getByRole('link', { name: 'Mergi la plăți' });
        this.homeEl = page.getByRole('heading', { name: 'Acasă' });
    } 

    async getCurrentValue() {
       return await this.amountEl.nth(0).textContent();
    }

    async moveIn(value: string) {
        await this.transferInternal.click();
        await this.valueInput.fill(value);
        await this.nextButton.click();
        await this.transferaButton.click();
        await this.goToPaymentsLink.click();
        await this.homeEl.click();
    }
}