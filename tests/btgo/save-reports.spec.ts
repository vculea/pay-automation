import { test, expect } from '@playwright/test';
import { credentials } from '../configs';
import { LoginPage } from '../../views/btgo/login';
import { ViewPage } from '../../views/btgo/view';

    test('BTGo Save reports', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(credentials.btgoId, credentials.btgoPassword);

        console.log("Waiting for approval...");

        const viewPage = new ViewPage(page);
        var days = await viewPage.getFirstDayOfMonthAndLastDayOfMonth("Noiembrie");
        await viewPage.openFilter();
        const fileNameContCurent = await viewPage.saveReport(days, credentials.contCurent);
        
        const fileNameContEconomii = await viewPage.saveReport(days, credentials.contEconomii);

        console.log("stop"); 
});

