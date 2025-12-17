import { test, expect } from '@playwright/test';
import { credentials } from './configs';

    test('BTGo Move all values from current cont to cont economii', async ({ page }) => {
    // Navigate to the BTGo application
    await page.goto('https://goapp.bancatransilvania.ro/app/auth/login');
    await page.setViewportSize({ width: 1920, height: 1080 });
  
    // Log in to the application
    await page.fill('#user', credentials.btgo_id);
    await page.fill('#password', credentials.btgo_password);
    await page.getByText('Autentifică-te').click();
    console.log("Waiting for approval...");

    const val = await page.textContent('.amount');
    console.info(val);

    await page.click('#transferInternalBtn');
    await page.fill('#sourceAccountValueInput', val || '0');
    await page.getByRole('button', { name: 'Mergi mai departe' }).click();
    await page.getByRole('button', { name: 'Transferă' }).click();
    await page.getByRole('link', { name: 'Mergi la plăți' }).click();
    await page.getByRole('heading', { name: 'Acasă' }).click();
    console.log("stop");
 
});

