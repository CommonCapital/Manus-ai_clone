# ========================================
# Node.js 22 + Chromium Docker Image
# ========================================
# Purpose: Web automation, scraping, and browsing capabilities
# Author: Created for Ben's sandbox environment
# ========================================

FROM node:22-slim

LABEL maintainer="Ben's Sandbox"
LABEL description="Node.js 22 with Chromium for web automation"
LABEL version="1.0.0"

# Set environment variables
ENV NODE_ENV=development
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox"

# Install system dependencies and Chromium
# Using Debian's apt (node:22-slim is Debian-based)
RUN apt-get update && apt-get install -y \
    # Chromium browser
    chromium \
    chromium-driver \
    # Required dependencies for Chromium
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    # Fonts for proper rendering
    fonts-liberation \
    fonts-noto-color-emoji \
    # Additional useful tools
    curl \
    wget \
    ca-certificates \
    # Clean up to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install global npm packages for web automation
RUN npm install -g \
    puppeteer \
    playwright \
    axios \
    cheerio \
    jsdom

# Create a non-root user for security
RUN groupadd -r pptruser && useradd -r -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /app \
    && chown -R pptruser:pptruser /home/pptruser

# Switch to non-root user
USER pptruser

# Verify installations
RUN node --version && npm --version && chromium --version

# Default command
CMD ["node"]

# ========================================
# USAGE EXAMPLES
# ========================================
#
# Build the image:
#   docker build -t nodejs-chromium-sandbox .
#
# Run interactively:
#   docker run -it --rm nodejs-chromium-sandbox bash
#
# Run with Puppeteer script:
#   docker run -it --rm -v $(pwd):/app nodejs-chromium-sandbox node script.js
#
# Puppeteer example (script.js):
#   const puppeteer = require('puppeteer');
#   (async () => {
#     const browser = await puppeteer.launch({
#       executablePath: '/usr/bin/chromium',
#       headless: 'new',
#       args: ['--no-sandbox', '--disable-setuid-sandbox']
#     });
#     const page = await browser.newPage();
#     await page.goto('https://example.com');
#     console.log(await page.title());
#     await browser.close();
#   })();
#
# ========================================