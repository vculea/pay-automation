import { Page, Locator } from '@playwright/test';
import { ReactDatePicker } from './datePicker';

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
  readonly datePicker: ReactDatePicker;

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
        this.datePicker = new ReactDatePicker(page, this.dataContract);
        this.description = page.getByLabel('Datele de identificare a bunului pentru care se cedează folosința').first();
        this.venitBrut = page.getByLabel('Venit brut').first();
    } 

    async goto() {
        await this.page.goto('https://www.anaf.ro/declaratii/duf');
    }

    async fill(persona: any) {
        await this.nameEl.fill(persona.name);
        await this.prenumEl.fill(persona.prenume);
        await this.cnpEl.fill(persona.cnp);
        await this.casOrCass.selectOption({value: '4'});

        for (const item of persona.items) {
            let elementVisible;
            do {
                await this.addButton.scrollIntoViewIfNeeded();
                await this.addButton.click();
                await this.selectVenitEl.scrollIntoViewIfNeeded();
                await this.selectVenitEl.waitFor({ state: 'visible', timeout: 2000 });
                let cls = await this.selectVenitEl.getAttribute('class');
                elementVisible = cls !== null && !cls.includes('cursor-not-allowed');
            } while (!elementVisible);
            await this.selectVenitEl.click();
            await this.selectVenitEl.selectOption({ value: item.category });
            await this.typeSelect.selectOption({ label: item.type });
            await this.nrContract.fill(item.contract);
            await this.datePicker.selectDate(item.data);
            await this.description.fill(item.description);
            await this.description.press('Enter');
            await this.venitBrut.fill(item.venit);
            await this.venitBrut.press('Enter');
            console.log("Verify...");
        }
    }    
}