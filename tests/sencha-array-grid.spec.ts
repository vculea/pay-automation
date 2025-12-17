import { test, expect } from '@playwright/test';
import type { Page, Frame } from 'playwright';

test.describe.configure({ mode: 'serial' });

test.describe('Sencha ExtJS Kitchen Sink - Array Grid', () => {
    let sharedPage: Frame | null;
    let mainPage: Page;
    
    // Grid selectors as constants
    const GRID_SELECTOR = '[role="grid"][aria-labelledby*="array-grid"]';
    const GRID_ROWS_SELECTOR = `${GRID_SELECTOR} .x-grid-item`;
    const GRID_HEADERS_SELECTOR = `${GRID_SELECTOR} .x-column-header`;
    const NAVIGATION_TREE_SELECTOR = '[role="region"][aria-labelledby*="navigation-tree"]';

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        mainPage = await context.newPage();
        
        await mainPage.goto('https://examples.sencha.com/extjs/7.9.0/examples/kitchensink/?classic#array-grid');
        await mainPage.waitForLoadState('networkidle');
        
        const iframe = mainPage.locator('iframe').first();
        await iframe.waitFor({ timeout: 10000 });
        sharedPage = await iframe.contentFrame();
        
        if (sharedPage) {
            await sharedPage.locator('body').waitFor({ timeout: 10000 });
        }
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
        if (!sharedPage) {
            throw new Error('Shared page not initialized');
        }
        
        const grid = sharedPage.locator(GRID_SELECTOR);
        await expect(grid).toBeVisible({ timeout: 10000 });
        
        const gridRows = sharedPage.locator(GRID_ROWS_SELECTOR);
        await expect(gridRows.first()).toBeVisible();
    });
    
    test('should have grid headers', async () => {
        if (!sharedPage) {
            throw new Error('Shared page not initialized');
        }
        
        const headers = sharedPage.locator(GRID_HEADERS_SELECTOR);
        await expect(headers.first()).toBeVisible();
        
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
    });
    
    test('should be able to interact with grid rows', async () => {
        if (!sharedPage) {
            throw new Error('Shared page not initialized');
        }
        
        const firstRow = sharedPage.locator(GRID_ROWS_SELECTOR).first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();
        await expect(firstRow).toHaveClass(/selected/);
    });
    
    test('should display navigation menu', async () => {
        if (!sharedPage) {
            throw new Error('Shared page not initialized');
        }
        
        const navigationTree = sharedPage.locator(NAVIGATION_TREE_SELECTOR);
        await expect(navigationTree).toBeVisible();
        
        const treeNodes = sharedPage.locator(`${NAVIGATION_TREE_SELECTOR} .x-tree-node-text`);
        await expect(treeNodes.first()).toBeVisible();
    });
    
    test('should handle page resize gracefully', async () => {
        if (!sharedPage) {
            throw new Error('Shared page not initialized');
        }
        
        const grid = sharedPage.locator(GRID_SELECTOR);
        
        await mainPage.setViewportSize({ width: 1200, height: 800 });
        await expect(grid).toBeVisible();
        
        await mainPage.setViewportSize({ width: 800, height: 600 });
        await expect(grid).toBeVisible();
    });
});