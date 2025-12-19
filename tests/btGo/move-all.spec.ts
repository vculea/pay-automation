import { test, expect } from '@playwright/test';
import { credentials } from '../../utils/configs';
import { LoginPage } from '../../views/btGo/login';
import { ViewPage } from '../../views/btGo/view';

test('BTGo Move all values from current cont to cont economii', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.btGoId, credentials.btGoPassword);

    console.log("Waiting for approval...");

    const viewPage = new ViewPage(page);
    const value = await viewPage.getCurrentValue();
    await viewPage.moveIn(value || '0');

    console.log("stop"); 
});

