import { Page, Locator } from '@playwright/test';

export class ANAFPage {
  readonly page: Page;
  readonly nameEl: Locator;
  readonly prenumEl: Locator;
  readonly cnpEl: Locator;
  readonly casOrCass: Locator;
  readonly selectVenitEl: Locator;
  readonly addButton: Locator;
  readonly typeSelect: Locator;
  readonly nrContract: Locator;
  readonly dataContract: Locator;
  readonly description: Locator;
  readonly venitBrut: Locator;

    constructor(page: Page) {
        this.page = page;
        this.nameEl = page.locator('#nume_c');
        this.prenumEl = page.getByLabel('Prenume');
        this.cnpEl = page.getByLabel('Cod de identificare fiscală');
        this.casOrCass = page.locator('#pensionar');
        this.selectVenitEl = page.locator('#A_categ_venit_0');
        this.addButton = page.getByRole('button', { name: 'Adaugă venit România +' });
        this.typeSelect = page.getByRole('combobox').filter({ hasText: 'Alege tipul' }).first();
        this.nrContract = page.getByLabel('Număr contract închiriere').first();
        this.dataContract = page.getByLabel('Data contractului').first();
        this.description = page.getByLabel('Datele de identificare a bunului pentru care se cedează folosința').first();
        this.venitBrut = page.getByLabel('Venit brut').first();
    } 

    async goto() {
        await this.page.goto('https://www.anaf.ro/declaratii/duf');
    }

    async fill(item: any) {
        await this.nameEl.fill(item.name);
        await this.prenumEl.fill(item.prenume);
        await this.cnpEl.fill(item.cnp);
        await this.casOrCass.selectOption({value: '4'});

        for (const detail of item.items) {
            let elementVisible;
            do {
                await this.addButton.click();
                await this.selectVenitEl.waitFor({ state: 'visible', timeout: 2000 });
                let cls = await this.selectVenitEl.getAttribute('class');
                elementVisible = cls !== null && !cls.includes('cursor-not-allowed');
            } while (!elementVisible);
            await this.selectVenitEl.click();
            await this.selectVenitEl.selectOption({ value: detail.category });
            await this.typeSelect.selectOption({ label: detail.type });
            await this.nrContract.fill(detail.contract);
            await this.dataContract.fill(detail.data);
            await this.dataContract.press('Enter');
            await this.description.fill(detail.description);
            await this.description.press('Enter');
            await this.venitBrut.fill(detail.venit);
            await this.venitBrut.press('Enter');
            console.log("Verify...");
        }
    }    
}