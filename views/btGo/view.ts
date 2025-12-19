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

    async getFirstDayOfMonthAndLastDayOfMonth(monthName: string) {
        for (let month = 0; month < 12; month++) {
            const date = new Date();
            date.setMonth(month);
            const name = date.toLocaleString('ro-RO', { month: 'long' });   
            if (name.toLowerCase() === monthName.toLowerCase()) {
                const firstDay = new Date(date.getFullYear(), month, 1);
                const lastDay = new Date(date.getFullYear(), month + 1, 0);
                const firstDayStr = firstDay.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const lastDayStr = lastDay.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return { firstDay: firstDayStr, lastDay: lastDayStr };
            }
        }
        return {firstDay : "", lastDay: ""};
    }

    async openFilter() {
        await this.page.click('#moreTransactionsBtn');
        console.log("Filter opened");
    }

    async saveReport(days: { firstDay: string; lastDay: string }, cont: string) {
        await this.page.getByRole('button', { name: 'Filtrează' }).click();
        await this.page.click('#periodOTHERRadioBtn');
        await this.page.locator('[placeholder="De la"]').fill(days.firstDay);
        await this.page.locator('[placeholder="Până la"]').fill(days.lastDay);
        await this.page.click('#applyFiltersBtn');
        await this.page.locator('#reportTypeSwitch').filter({ hasText: 'CSV' }).click();

        await this.page.click('#selectAccountBtn');
        await this.page.locator('.item').filter({ hasText: cont }).click();

        await this.page.click('#generateReportsBtn');
        
        const downloadPromise = this.page.waitForEvent('download');
        await this.page.locator('[data-mat-icon-name="downloadBulk"]').first().click();
        const download = await downloadPromise;
        const fileName = `${cont}_${days.firstDay.replace(/\//g, '-')}_${days.lastDay.replace(/\//g, '-')}.csv`;
        const downloadPath = `./downloads/${fileName}`;
        await download.saveAs(downloadPath);
        
        console.log(`Report saved successfully: ${fileName}`);
        return fileName;
    }
}