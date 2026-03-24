import { test, expect } from '@playwright/test';
import { dataJson } from '../../utils/configs';
import { ANAFPage } from '../../views/ANAF/view';

test('ANAF complete D212', async ({ page }) => {
    const viewPage = new ANAFPage(page);
    await viewPage.goto();    
    await viewPage.fill(dataJson.viorel);

    console.log("✅ Toate items adăugate cu succes!"); 
});
