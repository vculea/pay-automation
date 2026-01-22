import { Page, Locator } from '@playwright/test';

export class ANAFPage {
  readonly page: Page;
  readonly selector: Locator;
  readonly addButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.selector = page.locator('#A_categ_venit_0');
        this.addButton = page.getByRole('button', { name: 'Adaugă venit România +' });
    } 

    async goto() {
        await this.page.goto('https://www.anaf.ro/declaratii/duf');
    }

    async fill(item: any) {
        await this.page.locator('#nume_c').fill(item.name);
        await this.page.getByLabel('Prenume').fill(item.prenume);
        await this.page.getByLabel('Cod de identificare fiscală').fill(item.cnp);

        for (const detail of item.items) {
             console.log("Wait...");
            
            // Click până când elementul devine vizibil
            let elementVisible = false;
            while (!elementVisible) {
                await this.addButton.click();
                await this.selector.waitFor({ state: 'visible', timeout: 2000 });
                let cls = await this.selector.getAttribute('class');
                elementVisible = cls !== null && !cls.includes('cursor-not-allowed');
            }
            
            await this.selector.click();
            await this.selector.selectOption({ value: detail.category });

            await this.page.getByRole('combobox').filter({ hasText: 'Alege tipul' }).selectOption({ label: detail.type });
            await this.page.getByLabel('Număr contract închiriere').first().fill(detail.contract);
            await this.page.getByLabel('Data contractului').first().fill(detail.data);
            await this.page.getByLabel('Datele de identificare a bunului pentru care se cedează folosința').first().fill(detail.description);
            await this.page.getByLabel('Datele de identificare a bunului pentru care se cedează folosința').first().click();
            await this.page.getByLabel('Venit brut').first().fill(detail.venit);
            console.log("Verify...");
        }
    }    
}