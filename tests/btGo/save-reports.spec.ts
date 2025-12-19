import { test, expect } from '../../setup/baseTest';
import { credentials, googleSheets } from '../../utils/configs';
import { BtGoPage } from '../../views/btGo/view';
import { GoogleSheetsService } from '../googleSheets/google-sheets';
import * as fs from 'fs';
import * as path from 'path';

test.describe.configure({ mode: 'serial' });

test('BTGo Save reports and upload to Google Drive', async ({ page, storage }) => {
    const viewPage = new BtGoPage(page);
    
    await test.step('Login to BTGo', async () => {
        await viewPage.goto();
        await viewPage.login(credentials);
        console.log("Waiting for approval...");
    });

    await test.step('Save reports for current and economii accounts', async () => {
        const days = await viewPage.getFirstDayOfMonthAndLastDayOfMonth("Noiembrie");
        await viewPage.openFilter();
        const fileNameContCurent = await viewPage.saveReport(days, credentials.btGo.contCurent);
        storage.set('fileNameContCurent', fileNameContCurent);
        const fileNameContEconomii = await viewPage.saveReport(days, credentials.btGo.contEconomii);
        storage.set('fileNameContEconomii', fileNameContEconomii);
    });

    await test.step('Upload reports to Google Drive', async () => {
        const sheetsService = new GoogleSheetsService();
        const downloadsPath = path.join(process.cwd(), 'downloads');
        const fileNameContCurent = storage.get('fileNameContCurent');
        const fileNameContEconomii = storage.get('fileNameContEconomii');
 
        if (fileNameContCurent) {
            const filePath = path.join(downloadsPath, fileNameContCurent);
            await sheetsService.uploadFile(filePath, googleSheets.folderId);
        }

        if (fileNameContEconomii) {
            const filePath = path.join(downloadsPath, fileNameContEconomii);
            await sheetsService.uploadFile(filePath, googleSheets.folderId);
        }
    });
});

