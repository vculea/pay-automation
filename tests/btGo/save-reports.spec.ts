import { test, expect } from '@playwright/test';
import { credentials } from '../../utils/configs';
import { LoginPage } from '../../views/btGo/login';
import { ViewPage } from '../../views/btGo/view';

    test('BTGo Save reports', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(credentials.btGoId, credentials.btGoPassword);

        console.log("Waiting for approval...");

        const viewPage = new ViewPage(page);
        var days = await viewPage.getFirstDayOfMonthAndLastDayOfMonth("Noiembrie");
        await viewPage.openFilter();
        const fileNameContCurent = await viewPage.saveReport(days, credentials.contCurent);
        
        const fileNameContEconomii = await viewPage.saveReport(days, credentials.contEconomii);

        console.log("stop"); 
});

