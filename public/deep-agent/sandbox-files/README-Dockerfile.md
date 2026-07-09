# Node.js 22 + Chromium Docker Image

## Overview

This Dockerfile creates a sandbox environment with:
- **Node.js 22** (latest LTS)
- **Chromium browser** (headless-capable)
- **Web automation tools** pre-installed

## Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to run automation scripts:

```bash
cd sandbox-files

# Build the image
docker compose build

# Run the example script
docker compose run --rm nodejs-chromium node /app/scripts/example-scrape.js

# Or use the helper script
chmod +x run-script.sh
./run-script.sh scripts/example-scrape.js
```

### Option 2: Direct Docker Commands

```bash
# Build the image
docker build -t nodejs-chromium-sandbox .

# Interactive mode
docker run -it --rm nodejs-chromium-sandbox bash

# With volume mount for your scripts
docker run -it --rm -v $(pwd):/app nodejs-chromium-sandbox node your-script.js

# With more resources for heavy scraping
docker run -it --rm --shm-size=2gb -v $(pwd):/app nodejs-chromium-sandbox node your-script.js
```

## Docker Compose Features

| Feature | Description |
|---------|-------------|
| **Volume Mounts** | `./scripts` → `/app/scripts`, `./output` → `/app/output`, `./data` → `/app/data` |
| **shm_size** | 2GB shared memory for Chromium |
| **Security Options** | Configured for headless browser operation |
| **Resource Limits** | CPU: 2 cores, Memory: 4GB max |

### Docker Compose Commands

```bash
# Build image
docker compose build

# Run a specific script
docker compose run --rm nodejs-chromium node /app/scripts/your-script.js

# Interactive bash session
docker compose run --rm nodejs-chromium bash

# Install npm packages
docker compose run --rm nodejs-chromium npm install axios

# Run in background
docker compose up -d

# View logs
docker compose logs -f

# Stop and cleanup
docker compose down

# Rebuild after Dockerfile changes
docker compose build --no-cache
```

## Pre-installed Packages

| Package | Purpose |
|---------|---------|
| puppeteer | Browser automation |
| playwright | Modern browser automation |
| axios | HTTP requests |
| cheerio | HTML parsing (jQuery-like) |
| jsdom | DOM simulation |

## Usage Examples

### 1. Simple Web Scraping with Puppeteer

```javascript
// scrape.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  // Extract data
  const data = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1')).map(h => h.textContent)
    };
  });
  
  console.log(data);
  await browser.close();
})();
```

### 2. Web Scraping with Cheerio (Lightweight)

```javascript
// scrape-cheerio.js
const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const response = await axios.get('https://example.com');
  const $ = cheerio.load(response.data);
  
  const title = $('title').text();
  const links = $('a').map((i, el) => $(el).attr('href')).get();
  
  console.log({ title, links });
})();
```

### 3. Playwright for Modern Automation

```javascript
// playwright-test.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  // Fill forms
  await page.fill('input[name="q"]', 'search term');
  await page.press('input[name="q"]', 'Enter');
  
  await browser.close();
})();
```

## Important Notes

### Memory Issues?

If you encounter memory errors with Chromium, increase shared memory:

```bash
docker run --shm-size=2gb ...
```

### Headless Mode

The image is configured for headless operation by default. For debugging, you can use:

```javascript
headless: false  // Requires X11 forwarding or VNC
```

### Security

- Runs as non-root user (`pptruser`)
- Sandboxed for security
- No GPU dependencies (uses software rendering)

## Integration with Skills

To use this image in your nodejs-sandbox skill, update the skill configuration:

```json
{
  "image": "nodejs-chromium-sandbox",
  "timeout_seconds": 600,
  "resource": {
    "cpu": "2",
    "memory": "4Gi"
  }
}
```

## File Location

```
sandbox-files/
├── Dockerfile           # Main Dockerfile
└── README-Dockerfile.md # This documentation
```

---

Created for Ben's sandbox environment 🚀