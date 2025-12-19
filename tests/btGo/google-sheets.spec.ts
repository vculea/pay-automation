import { test, expect } from '@playwright/test';
import { googleSheets } from '../../utils/configs';
import { GoogleSheetsService } from '../googleSheets/google-sheets';

test('Google Sheets - Read Data', async () => {
    const sheetsService = new GoogleSheetsService();
    
    const data = await sheetsService.readData(googleSheets);
    
    console.log(`📊 Total rows: ${data.length}`);
    
    data.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
    });
    
    expect(data.length).toBeGreaterThan(0);
}); 