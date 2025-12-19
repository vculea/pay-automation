import { test, expect } from '@playwright/test';
import { credentials } from '../../utils/configs';
import { BtGoPage } from '../../views/btGo/view';

test('BTGo Move all values from current cont to cont economii', async ({ page }) => {
    const viewPage = new BtGoPage(page);
    await viewPage.goto();
    await viewPage.login(credentials);

    console.log("Waiting for approval...");

    const value = await viewPage.getCurrentValue();
    await viewPage.moveIn(value || '0');

    console.log("stop"); 
});

