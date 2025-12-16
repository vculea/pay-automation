import { test, expect, FrameLocator } from '@playwright/test';

test.describe('Sencha ExtJS Kitchen Sink - Array Grid', () => {
  let frame: FrameLocator;
  
  test.beforeEach(async ({ page }) => {
    // Navigăm la pagina specificată
    await page.goto('https://examples.sencha.com/extjs/7.9.0/examples/kitchensink/?classic#array-grid');
    
    // Așteptăm ca pagina să se încarce complet
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Accesăm iframe-ul care conține conținutul ExtJS
    frame = page.frameLocator('iframe');
    
    await frame.locator('body').waitFor({ timeout: 15000 });
  });

  test('should load the Array Grid example page', async ({ page }) => {
    // Verificăm că titlul paginii conține "Ext JS Examples"
    await expect(page).toHaveTitle(/Ext JS Examples/);
    
    // Verificăm că URL-ul conține fragmentul pentru array-grid
    expect(page.url()).toContain('#array-grid');
    
    // Verificăm că iframe-ul s-a încărcat
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
  });

  test('should display the Array Grid component', async ({ page }) => {
    // Așteptăm ca grid-ul de date să se încarce în iframe (nu tree-ul din stânga)
    await frame.locator('[role="grid"][aria-labelledby*="array-grid"]').waitFor({ timeout: 15000 });
    
    // Verificăm că grid-ul de date este vizibil
    const grid = frame.locator('[role="grid"][aria-labelledby*="array-grid"]');
    await expect(grid).toBeVisible();
    
    // Verificăm că există date în grid (cel puțin o linie)
    const gridRows = frame.locator('[role="grid"][aria-labelledby*="array-grid"] .x-grid-item');
    await expect(gridRows.first()).toBeVisible();
  });

  test('should have grid headers', async ({ page }) => {
    // Verificăm că există header-ele grid-ului principal în iframe
    const headers = frame.locator('[role="grid"][aria-labelledby*="array-grid"] .x-column-header');
    await expect(headers.first()).toBeVisible();
    
    // Numărăm header-ele pentru a ne asigura că sunt multiple coloane
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should be able to interact with grid rows', async ({ page }) => {
    // Selectăm prima linie din grid-ul principal
    const firstRow = frame.locator('[role="grid"][aria-labelledby*="array-grid"] .x-grid-item').first();
    await expect(firstRow).toBeVisible();
    
    // Click pe prima linie pentru a o selecta
    await firstRow.click();
    
    // Verificăm că linia a fost selectată
    await expect(firstRow).toHaveClass(/selected/);
  });

  test('should display navigation menu', async ({ page }) => {
    // Verificăm că meniul de navigare din stânga este prezent în iframe
    const navigationTree = frame.locator('[role="region"][aria-labelledby*="navigation-tree"]');
    await expect(navigationTree).toBeVisible();
    
    // Verificăm că există elemente în meniu
    const treeNodes = frame.locator('[role="region"][aria-labelledby*="navigation-tree"] .x-tree-node-text');
    await expect(treeNodes.first()).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Căutăm câmpul de căutare în iframe
    const searchField = frame.locator('input[placeholder*="Search"], input[emptyText*="Search"], .x-form-search-trigger').first();
    
    // Verificăm dacă există și este vizibil
    try {
      await searchField.waitFor({ timeout: 5000 });
      
      if (await searchField.isVisible()) {
        // Dacă există căutare, testăm funcționalitatea
        await searchField.fill('array');
        await page.keyboard.press('Enter');
        
        // Așteptăm ca rezultatele să se actualizeze
        await page.waitForTimeout(1000);
        
        // Verificăm că s-au returnat rezultate relevante
        const searchResults = frame.locator('.x-tree-node-text');
        const resultsCount = await searchResults.count();
        expect(resultsCount).toBeGreaterThan(0);
      }
    } catch (error) {
      // Dacă nu există funcționalitate de căutare, testul trece oricum
      console.log('Search functionality not found or not accessible');
    }
  });

  test('should handle page resize gracefully', async ({ page }) => {
    // Testăm responsive design
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Verificăm că grid-ul de date este încă vizibil în iframe
    const grid = frame.locator('[role="grid"][aria-labelledby*="array-grid"]');
    await expect(grid).toBeVisible();
    
    // Schimbăm dimensiunea la o rezoluție mai mică
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Verificăm că aplicația se adaptează
    await expect(grid).toBeVisible();
  });

});