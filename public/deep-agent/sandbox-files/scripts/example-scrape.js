// ========================================
// Example Web Scraping Script
// ========================================
// Demonstrates Puppeteer usage with Chromium
// ========================================

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting web scraping example...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to example.com
    console.log('📍 Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Extract data
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        heading: document.querySelector('h1')?.textContent || 'No heading',
        paragraph: document.querySelector('p')?.textContent || 'No paragraph',
        url: window.location.href
      };
    });
    
    console.log('📊 Extracted data:', data);
    
    // Take screenshot
    const screenshotPath = '/app/output/example-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    
    // Save data to JSON
    const dataPath = '/app/output/example-data.json';
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved to: ${dataPath}`);
    
    console.log('✅ Scraping completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});