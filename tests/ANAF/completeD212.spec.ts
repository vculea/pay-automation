import { test, expect } from '@playwright/test';
import { credentials } from '../../utils/configs';
import { ANAFPage } from '../../views/ANAF/view';

const data = [
    { name: 'Culea', prenume: 'Viorel', cnp: credentials.me.cnp, 
        items: [
            {
            category: '1015',
            type: '2 — Chirie în lei',
            contract: '7',
            data: '01.01.2023',
            venit: '24000',
            description: 'Tarnavelor 47B, Ap. 7',
            },
            {
            category: '1015',
            type: '2 — Chirie în lei',
            contract: '8',
            data: '15.02.2023',
            venit: '25000',
            description: 'Muresului 53, Ap. 15',
            }
        ] 
    },  
];

test('ANAF complete D212', async ({ page }) => {
    const viewPage = new ANAFPage(page);
    await viewPage.goto();    
    await viewPage.fill(data[0]);

    console.log("✅ Toate items adăugate cu succes!"); 
});
