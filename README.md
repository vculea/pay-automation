# Pay Automation

Automated testing project using Playwright, specifically optimized for testing Sencha ExtJS applications.

## Features

- **Automated Testing**: Playwright test suite for Sencha ExtJS Kitchen Sink
- **Cross-browser Testing**: Chrome, Firefox, Safari support
- **TypeScript**: Full type safety and modern development
- **Clean Architecture**: Minimal, focused codebase

## Installation

```bash
npm install
```

## Usage

### Run Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Debug tests
npm run test:debug
```

### Caserie: reusable Google authentication

Start Caserie at `http://localhost:5173/`, then run:

```powershell
npx playwright test --project=caserie --workers=1
```

On the first run, complete Google login (including any MFA) in the opened
browser. The authentication setup waits up to four minutes and saves the
application-origin cookies, localStorage and IndexedDB to
`playwright/.auth/caserie.json`. Caserie uses Firebase `browserSessionPersistence`,
so its sessionStorage is saved separately to `playwright/.auth/caserie.session.json`
and restored before the application loads, only on the Caserie origin.
Later runs validate and reuse this session in a new browser context.
If it expires, the setup asks for Google login again.

This uses an isolated browser rather than your personal Chrome profile.
Both session files grant access to the application: never share or commit them.
The existing `playwright/.auth/` ignore rule excludes it from Git.
To switch accounts, delete only `playwright/.auth/caserie.json` and
`playwright/.auth/caserie.session.json`, then run again.
Authentication traces, screenshots, and videos are disabled.

The authentication setup does not add financial records. Caserie specs can modify real data.

### Caserie: attach Oblio invoices

```powershell
npx playwright test oblio.spec.ts --project=caserie --workers=1 --retries=0
```

This test attaches PDFs to matching expense transactions. Exact amounts take
priority; amounts sharing the first decimal digit are also considered, with a
warning in the console and test report. Only transactions marked "Nu" in the grid's
eFactura column are checked; "Da" and the dash status are skipped before matching
Oblio documents, opening the edit dialog or downloading a PDF.
Transactions whose Edit button is disabled because of active storno records are
skipped with a warning; no storno records are changed or deleted, and candidate
invoices remain available for other transactions. Other edit failures still fail
the test.
For eligible transactions the dialog is checked again, detecting existing eFactura
documents even under "Alte documente atasate". If the dialog does not offer an eFactura
upload zone (for example, special donations or commissions), the transaction is
skipped with a warning and its candidate invoice remains available for other
transactions. The test checks the upload response and waits for the server-assigned
filename to appear in the stored attachment list before saving.

### Test Structure

The project contains automated tests for Sencha ExtJS Kitchen Sink Array Grid component:

- Page load verification
- Grid component visibility
- Grid headers validation  
- Row interaction testing
- Navigation menu testing
- Responsive design testing

## Configuration

- `playwright.config.ts` - Playwright configuration
- `tests/` - Test files directory
- `tsconfig.json` - TypeScript configuration

## Browser Support

- Chromium (Chrome/Edge)
- Firefox  
- WebKit (Safari)

## License

ISC
      "command": "node",
      "args": ["path/to/pay-automation/build/index.js"]
    }
  }
}
```

### Available Tools

1. **browser_launch** - Launch browser instance
2. **page_create** - Create new page
3. **page_navigate** - Navigate to URL
4. **iframe_switch** - Switch to iframe context
5. **element_click** - Click elements
6. **element_fill** - Fill input fields
7. **element_wait** - Wait for elements
8. **element_check_visible** - Check element visibility
9. **run_sencha_test** - Run complete Sencha test suite
10. **browser_close** - Close browser

### Example Usage

```javascript
// Launch browser
await mcp.callTool('browser_launch', { headless: false });

// Create page
await mcp.callTool('page_create', { pageId: 'main' });

// Navigate to Sencha
await mcp.callTool('page_navigate', { 
  pageId: 'main', 
  url: 'https://examples.sencha.com/extjs/7.9.0/examples/kitchensink/?classic#array-grid'
});

// Switch to iframe
await mcp.callTool('iframe_switch', { 
  pageId: 'main', 
  frameId: 'content' 
});

// Interact with elements
await mcp.callTool('element_click', { 
  contextId: 'content', 
  selector: '[role="grid"] .x-grid-item:first-child' 
});
```

### Quick Test

Run the complete Sencha test suite:

```javascript
await mcp.callTool('run_sencha_test', { headless: true });
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Start server
npm start

# Run Playwright tests
npm test
```

## Technologies

- **MCP SDK** - Model Context Protocol integration
- **Playwright** - Browser automation
- **TypeScript** - Type safety
- **Node.js** - Runtime environment

## Test Suite

The built-in Sencha ExtJS test includes:
- Page loading verification
- Array Grid component testing
- Header and row interaction
- Navigation menu validation
- Responsive design testing

## Architecture

```
src/
├── index.ts          # MCP Server implementation
tests/
├── sencha-array-grid.spec.ts  # Playwright test suite
build/                # Compiled JavaScript
```
