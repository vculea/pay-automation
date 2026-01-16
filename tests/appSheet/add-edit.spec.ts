import { test, expect } from '@playwright/test';
import { credentials } from '../../utils/configs';
import { AppSheetPage } from '../../views/appSheet/view';

const addData = [
    { name: 'Rata Iunie', categorie: 'Cheltuieli', subcategory: 'Rata', price: '1906.68', payment: 'Card', date: '06/15/2026' },
    { name: 'Rata Iulie', categorie: 'Cheltuieli', subcategory: 'Rata', price: '1872.45', payment: 'Card', date: '07/15/2026' },
];

test('AppSheet I add values', async ({ page }) => {
    const viewPage = new AppSheetPage(page);
    await viewPage.goto();
    
    await viewPage.login(credentials.appSheet);

    console.log("Pregătesc să adaug items...");

    for (const item of addData) {  
        await viewPage.addItem(item);
        await page.waitForTimeout(200); // Pauză între adăugări
    }
    console.log("✅ Toate items adăugate cu succes!"); 
});

const editData = [
    { name: 'Rata Mai', categorie: 'Cheltuieli', subcategory: 'Rata', price: '1881.15', payment: 'Card', date: '05/15/2026' },
    // { name: 'Rata Iulie', categorie: 'Cheltuieli', subcategory: 'Rata', price: '1872.45', payment: 'Card', date: '07/15/2026' },
];

test('AppSheet I edit values', async ({ page }) => {
    const viewPage = new AppSheetPage(page);
    await viewPage.goto();
    
    await viewPage.login(credentials.appSheet);

    console.log("Pregătesc să editez items...");

    for (const item of editData) {  
        await viewPage.editItem(item);
        await page.waitForTimeout(200); // Pauză între adăugări
    }
    console.log("✅ Toate items editate cu succes!"); 
});

