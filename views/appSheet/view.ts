import { Page, Locator } from '@playwright/test';

export class AppSheetPage {
  readonly page: Page;
  readonly prevBtn: Locator;
  readonly nextBtn: Locator;
  readonly editBtn: Locator; 
  readonly saveBtn: Locator;    
  readonly startDateEl: Locator;  
  readonly table: Locator; 
  readonly row: Locator; 
  readonly addWindow: Locator;
  readonly priceField: Locator;
  readonly dashboard: Locator;
  readonly addButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.prevBtn = page.getByRole('button', { name: 'Prev' });
        this.nextBtn = page.getByRole('button', { name: 'Next' });
        this.editBtn = page.getByRole('button', { name: 'Edit' });
        this.saveBtn = page.getByRole('button', { name: 'Save' });
        this.startDateEl = page.getByLabel('Start Date');
        this.table = page.locator('#Dashboard___FilteredDataView');
        this.row = this.table.locator('.DeckRow');
        this.priceField = page.getByLabel('Suma');
        this.dashboard = page.getByRole('link', { name: 'Dashboard' });
        this.addButton = page.getByRole('button', { name: 'Add' });
        this.addWindow = page.getByTestId('FilteredData');
    } 

    async goTo() {
        await this.page.goto('https://www.appsheet.com/start/6ab480fa-d9c8-4d57-aab6-4e4c2f615b76');
    }

    async login(credentials: any) {
        await this.goTo();
        // Așteaptă ca butonul Google să fie disponibil
        await this.page.waitForSelector('#Google', { timeout: 10000 });
        await this.page.locator('#Google').click();
        
        // Așteaptă ca pagina de login Google să se încarce
        await this.page.getByLabel('Email or phone').fill(credentials.email);
        await this.page.getByRole('button', { name: 'Next' }).click();
        
        // Așteaptă câmpul de parolă
        await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });
        await this.page.getByLabel('Enter your password').fill(credentials.password);
        await this.page.getByRole('button', { name: 'Next' }).click();
    }

    async addItem(item: any){
        await this.addButton.click();
        await this.page.getByLabel('Name').fill(item.name);
        
        // Selectează categoria
        if(item.categorie === "Cheltuieli") {
            await this.page.getByRole('button', { name: 'Cheltuieli' }).click();
        } else {
            await this.page.getByRole('button', { name: 'Venituri' }).click();
        }
        
        await this.page.getByLabel('SubCategorie').fill(item.subcategory);
        await this.page.keyboard.press('Enter');

        // Completează prețul
        await this.priceField.fill(item.price);
        
        // Selectează metoda de plată
        await this.page.getByRole('button', { name: item.payment }).click();
        
        // Completează data - convertește formatul MM/DD/YYYY în YYYY-MM-DDTHH:mm
        const formattedDate = this.convertToDatetimeLocal(item.date);
        await this.addWindow.getByLabel('Date').clear();
        await this.addWindow.getByLabel('Date').fill(formattedDate);
        
        await this.saveBtn.click();
    }

    async editItem(item: any){
        await this.navigateToMonth(item.date);
        
        await this.findAndClickItem(item.categorie, item.name);
        
        await this.editBtn.click();
        
        await this.priceField.clear();
        await this.priceField.fill(item.price);
        
        await this.saveBtn.click();
        
        await this.page.getByRole('navigation', { name: 'breadcrumbs' }).getByRole('button', { name: 'Dashboard' }).click();
    }

    private async findAndClickItem(category: string, name: string, maxRetries: number = 5): Promise<void> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const itemElement = this.table.locator('.DeckRow').filter({ hasText: name });
            
            const isPresent = await itemElement.count() > 0;
            if (!isPresent) {
                const lastRow = this.row.last();
                await lastRow.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
            } else {
                await itemElement.first().scrollIntoViewIfNeeded();
                await itemElement.first().click();
                return;
            }
        }
        throw new Error(`Nu s-a găsit elementul "${name}" în categoria "${category}" după ${maxRetries} încercări`);
    }

    // Convertește data din formatul MM/DD/YYYY în YYYY-MM-DDTHH:mm
    private convertToDatetimeLocal(dateString: string): string {
        const [month, day, year] = dateString.split('/');
        // Formatul datetime-local: YYYY-MM-DDTHH:mm (ora 00:00 by default)
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00`;
    }

    private async navigateToMonth(dateString: string, maxRetries: number = 12): Promise<void> {
        // Parse data item-ului (format MM/DD/YYYY)
        const [monthStr, dayStr, yearStr] = dateString.split('/');
        const targetMonth = parseInt(monthStr, 10);
        const targetYear = parseInt(yearStr, 10);

        for (let i = 0; i < maxRetries; i++) {
            // Obține valoarea din câmpul Start Date
            const value = await this.startDateEl.inputValue();
            
            // Parse data start (format yyyy-MM-dd)
            const startDate = new Date(value);
            const actualMonth = startDate.getMonth() + 1;
            const actualYear = startDate.getFullYear();

            // Verifică dacă am ajuns la luna dorită
            if (targetMonth === actualMonth && targetYear === actualYear) {
                return;
            }

            // Navighează în funcție de diferența dintre luni/ani
            if (targetYear > actualYear || (targetYear === actualYear && targetMonth > actualMonth)) {
                await this.prevBtn.click();
            } else {
                await this.nextBtn.click();
            }

            await this.page.waitForTimeout(300);
        }

        throw new Error(`Nu s-a putut naviga la luna ${targetMonth}/${targetYear} după ${maxRetries} încercări`);
    }
}