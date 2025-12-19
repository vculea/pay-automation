import { test, expect } from '@playwright/test';
import { credentials, googleSheets } from '../../utils/configs';
import { BtGoPage } from '../../views/btGo/view';
import { GoogleSheetsService } from '../googleSheets/google-sheets';
import * as fs from 'fs';
import * as path from 'path';

test('BTGo Save reports and upload to Google Drive', async ({ page }) => {
    const viewPage = new BtGoPage(page);
    await viewPage.goto();
    await viewPage.login(credentials);

    console.log("Waiting for approval...");

    const days = await viewPage.getFirstDayOfMonthAndLastDayOfMonth("Noiembrie");
    await viewPage.openFilter();
    const fileNameContCurent = await viewPage.saveReport(days, credentials.contCurent);
    const fileNameContEconomii = await viewPage.saveReport(days, credentials.contEconomii);

    // Upload files to Google Drive
    const sheetsService = new GoogleSheetsService();
    const downloadsPath = path.join(process.cwd(), 'downloads');
 
    if (fileNameContCurent) {
        const filePath = path.join(downloadsPath, fileNameContCurent);
        if (fs.existsSync(filePath)) {
            await sheetsService.uploadFile(filePath, googleSheets.folderId);
        }
    }

    if (fileNameContEconomii) {
        const filePath = path.join(downloadsPath, fileNameContEconomii);
        if (fs.existsSync(filePath)) {
            await sheetsService.uploadFile(filePath, googleSheets.folderId);
        }
    }

    console.log("✅ Reports saved and uploaded to Google Drive successfully"); 
});

