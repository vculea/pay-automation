# Pay Automation MCP Server

Model Context Protocol (MCP) Server that provides Playwright automation tools for payment site testing, specifically optimized for Sencha ExtJS applications.

## Features

- **Browser Management**: Launch and control browser instances
- **Page Navigation**: Create pages and navigate to URLs  
- **Frame Switching**: Handle iframe contexts seamlessly
- **Element Interactions**: Click, fill, wait for elements
- **Automated Testing**: Built-in Sencha ExtJS test suite
- **TypeScript**: Full type safety and modern development

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "pay-automation": {
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
