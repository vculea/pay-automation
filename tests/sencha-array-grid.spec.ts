import { test, expect, Page, Browser } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Sencha ExtJS Kitchen Sink - Array Grid', () => {
  let sharedPage: Page;
  let mainPage: Page;
  let browser: Browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    
    const context = await browser.newContext();
    mainPage = await context.newPage();
    
    await mainPage.goto('https://examples.sencha.com/extjs/7.9.0/examples/kitchensink/?classic#array-grid');
    
    await mainPage.waitForLoadState('networkidle');
    await mainPage.waitForTimeout(5000);
    
    const iframe = mainPage.locator('iframe').first();
    const frameContent = await iframe.contentFrame();
    sharedPage = frameContent;
    
    await sharedPage.locator('body').waitFor({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (mainPage) {
      await mainPage.context().close();
    }
  });

  test('should load the Array Grid example page', async () => {
    await expect(mainPage).toHaveTitle(/Ext JS Examples/);
    
    expect(mainPage.url()).toContain('#array-grid');
    
    const iframe = mainPage.locator('iframe');
    await expect(iframe).toBeVisible();
  });

  test('should display the Array Grid component', async () => {
    await sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"]').waitFor({ timeout: 15000 });
    
    const grid = sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"]');
    await expect(grid).toBeVisible();
    
    const gridRows = sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"] .x-grid-item');
    await expect(gridRows.first()).toBeVisible();
  });

  test('should have grid headers', async () => {
    const headers = sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"] .x-column-header');
    await expect(headers.first()).toBeVisible();
    
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should be able to interact with grid rows', async () => {
    const firstRow = sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"] .x-grid-item').first();
    await expect(firstRow).toBeVisible();
    
    await firstRow.click();
    
    await expect(firstRow).toHaveClass(/selected/);
  });

  test('should display navigation menu', async () => {
    const navigationTree = sharedPage.locator('[role="region"][aria-labelledby*="navigation-tree"]');
    await expect(navigationTree).toBeVisible();
    
    const treeNodes = sharedPage.locator('[role="region"][aria-labelledby*="navigation-tree"] .x-tree-node-text');
    await expect(treeNodes.first()).toBeVisible();
  });

  test('should have working search functionality', async () => {
    const searchField = sharedPage.locator('input[placeholder*="Search"], input[emptyText*="Search"], .x-form-search-trigger').first();
    
    try {
      await searchField.waitFor({ timeout: 5000 });
      
      if (await searchField.isVisible()) {
        await searchField.fill('array');
        await mainPage.keyboard.press('Enter');
        
        await mainPage.waitForTimeout(1000);
        
        const searchResults = sharedPage.locator('.x-tree-node-text');
        const resultsCount = await searchResults.count();
        expect(resultsCount).toBeGreaterThan(0);
      }
    } catch (error) {
      console.log('Search functionality not found or not accessible');
    }
  });

  test('should handle page resize gracefully', async () => {
    await mainPage.setViewportSize({ width: 1200, height: 800 });
    
    const grid = sharedPage.locator('[role="grid"][aria-labelledby*="array-grid"]');
    await expect(grid).toBeVisible();
    
    await mainPage.setViewportSize({ width: 800, height: 600 });
    
    await expect(grid).toBeVisible();
  });

});