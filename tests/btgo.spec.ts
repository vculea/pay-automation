import { test, expect } from '@playwright/test';
import { credentials } from './configs';
import { LoginPage } from './views/btgo/login';
import { ViewPage } from './views/btgo/view';

    test('BTGo Move all values from current cont to cont economii', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(credentials.btgo_id, credentials.btgo_password);

        console.log("Waiting for approval...");

        const viewPage = new ViewPage(page);
        const value = await viewPage.getCurrentValue();
        await viewPage.moveIn( value|| '0');

        console.log("stop"); 
});

