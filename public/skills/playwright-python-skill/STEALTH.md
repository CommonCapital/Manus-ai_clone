# Bot Detection Avoidance Guide

Complete guide for bypassing bot detection systems using Playwright Python.

## Why Bot Detection Matters

Modern websites use sophisticated detection methods:
- **Browser Fingerprinting** - Canvas, WebGL, AudioContext, fonts
- **Behavior Analysis** - Mouse movements, scroll patterns, timing
- **Network Patterns** - Request timing, headers, TLS fingerprints
- **JavaScript Challenges** - Cloudflare, reCAPTCHA, hCaptcha
- **Headless Detection** - `navigator.webdriver`, automation flags

## Quick Start

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Apply stealth to the page
    stealth_sync(page)
    
    page.goto('https://bot.sannysoft.com/')
    page.screenshot(path='/tmp/stealth_test.png')
    browser.close()
```

## Detection Test Sites

Test your stealth implementation:
- https://bot.sannysoft.com/ - Comprehensive bot test
- https://arh.antoinevastel.com/bots/areyouheadless - Headless detection
- https://pixelscan.net/ - Browser fingerprinting
- https://www.browserscan.net/bot-detection - Bot detection suite
- https://iphey.com/browser-privacy-test/ - Privacy test

---

## Core Stealth Techniques

### 1. Playwright-Stealth Library

The `playwright-stealth` library patches common detection vectors:

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--no-sandbox',
            '--disable-infobars',
            '--disable-dev-shm-usage',
            '--disable-browser-side-navigation',
            '--disable-gpu',
        ]
    )
    page = browser.new_page()
    stealth_sync(page)  # Apply all stealth patches
    
    page.goto('https://example.com')
    browser.close()
```

### 2. Realistic Browser Context

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    # Use persistent context for realistic profile
    context = p.chromium.launch_persistent_context(
        user_data_dir='/tmp/browser_profile',
        headless=False,
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale='en-US',
        timezone_id='America/New_York',
        geolocation={'latitude': 40.7128, 'longitude': -74.0060},
        permissions=['geolocation'],
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
        ]
    )
    
    page = context.new_page()
    stealth_sync(page)
    
    page.goto('https://example.com')
    context.close()
```

### 3. Realistic User Agent

```python
from fake_useragent import UserAgent

ua = UserAgent()
random_ua = ua.random  # Get a random realistic user agent

# Or use specific browser
chrome_ua = ua.chrome
firefox_ua = ua.firefox

# In Playwright context
context = browser.new_context(
    user_agent=chrome_ua,
    viewport={'width': 1920, 'height': 1080}
)
```

---

## Human Behavior Simulation

### 1. Realistic Mouse Movements

```python
import random
import math

def human_like_mouse_move(page, target_x, target_y, duration_ms=1000):
    """Move mouse in a human-like curved path."""
    current = page.evaluate('() => ({x: window.mouseX || 0, y: window.mouseY || 0})')
    
    # Generate bezier curve points
    steps = random.randint(20, 40)
    start_x, start_y = current['x'], current['y']
    
    # Random control points for natural curve
    ctrl1_x = start_x + (target_x - start_x) * random.uniform(0.2, 0.4) + random.uniform(-50, 50)
    ctrl1_y = start_y + (target_y - start_y) * random.uniform(0.2, 0.4) + random.uniform(-50, 50)
    ctrl2_x = start_x + (target_x - start_x) * random.uniform(0.6, 0.8) + random.uniform(-50, 50)
    ctrl2_y = start_y + (target_y - start_y) * random.uniform(0.6, 0.8) + random.uniform(-50, 50)
    
    for i in range(steps):
        t = i / steps
        # Cubic bezier formula
        x = (1-t)**3 * start_x + 3*(1-t)**2*t * ctrl1_x + 3*(1-t)*t**2 * ctrl2_x + t**3 * target_x
        y = (1-t)**3 * start_y + 3*(1-t)**2*t * ctrl1_y + 3*(1-t)*t**2 * ctrl2_y + t**3 * target_y
        
        page.mouse.move(x, y)
        time.sleep(duration_ms / steps / 1000 + random.uniform(0, 0.02))
    
    page.mouse.move(target_x, target_y)

# Usage
human_like_mouse_move(page, 500, 300, duration_ms=800)
```

### 2. Random Delays

```python
import random
import time

def human_delay(min_ms=100, max_ms=500):
    """Add a random human-like delay."""
    delay = random.uniform(min_ms / 1000, max_ms / 1000)
    time.sleep(delay)

def typing_delay():
    """Simulate realistic typing speed."""
    return random.uniform(0.05, 0.15)

# Usage in form filling
page.click('input[name="email"]')
human_delay(200, 500)

email = 'test@example.com'
for char in email:
    page.keyboard.type(char, delay=typing_delay() * 1000)
```

### 3. Realistic Scrolling

```python
import random
import time

def human_scroll(page, direction='down', distance=500):
    """Scroll in a human-like manner with pauses."""
    scroll_amount = random.randint(100, 300)
    scrolls_needed = distance // scroll_amount
    
    for _ in range(scrolls_needed):
        if direction == 'down':
            page.mouse.wheel(0, scroll_amount)
        else:
            page.mouse.wheel(0, -scroll_amount)
        
        # Random pause between scrolls
        time.sleep(random.uniform(0.1, 0.3))
    
    # Occasional pause to "read"
    if random.random() > 0.7:
        time.sleep(random.uniform(0.5, 1.5))

# Usage
human_scroll(page, 'down', 1000)
```

### 4. Random Page Interactions

```python
def simulate_browsing(page, duration_seconds=30):
    """Simulate natural browsing behavior."""
    start_time = time.time()
    
    while time.time() - start_time < duration_seconds:
        action = random.choice(['scroll', 'move', 'pause', 'click_random'])
        
        if action == 'scroll':
            human_scroll(page, random.choice(['down', 'up']), random.randint(200, 600))
        elif action == 'move':
            x, y = random.randint(0, 1920), random.randint(0, 1080)
            human_like_mouse_move(page, x, y)
        elif action == 'pause':
            time.sleep(random.uniform(1, 3))
        elif action == 'click_random':
            # Click on a random non-interactive element
            elements = page.locator('p, div, span').all()
            if elements:
                random.choice(elements).click()
        
        time.sleep(random.uniform(0.5, 2))
```

---

## Advanced Evasion Techniques

### 1. WebGL Fingerprint Spoofing

```python
async def spoof_webgl(page):
    """Override WebGL fingerprinting."""
    await page.add_init_script("""
        // Override WebGL fingerprint
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            // Spoof common fingerprint values
            if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
                return 'Google Inc. (NVIDIA)';
            }
            if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
                return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)';
            }
            return getParameter.call(this, parameter);
        };
    """)
```

### 2. Canvas Fingerprint Noise

```python
async def add_canvas_noise(page):
    """Add noise to canvas fingerprinting."""
    await page.add_init_script("""
        // Add noise to canvas toDataURL
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type) {
            // Add subtle noise to prevent fingerprinting
            const context = this.getContext('2d');
            if (context) {
                const imageData = context.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    // Add tiny random noise
                    imageData.data[i] += Math.floor(Math.random() * 3) - 1;
                }
                context.putImageData(imageData, 0, 0);
            }
            return originalToDataURL.apply(this, arguments);
        };
    """)
```

### 3. Navigator Overrides

```python
async def override_navigator(page):
    """Override navigator properties to hide automation."""
    await page.add_init_script("""
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                { name: 'Native Client', filename: 'internal-nacl-plugin' }
            ]
        });
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
        
        // Override hardwareConcurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8
        });
        
        // Override deviceMemory
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8
        });
        
        // Override platform
        Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32'
        });
    """)
```

### 4. Timezone & Geolocation Consistency

```python
# Critical: Ensure timezone matches geolocation
context = browser.new_context(
    timezone_id='America/New_York',
    locale='en-US',
    geolocation={'latitude': 40.7128, 'longitude': -74.0060},
    permissions=['geolocation']
)
```

---

## Proxy & Network Configuration

### 1. Rotating Proxies

```python
from playwright.sync_api import sync_playwright

# Proxy configuration
proxy_config = {
    'server': 'http://proxy.example.com:8080',
    'username': 'user',
    'password': 'pass'
}

with sync_playwright() as p:
    browser = p.chromium.launch(
        proxy=proxy_config,
        headless=False
    )
```

### 2. Residential Proxies (Recommended)

```python
# Using residential proxy service
proxy = {
    'server': 'http://gate.smartproxy.com:7000',
    'username': 'username',
    'password': 'password'
}

browser = p.chromium.launch(proxy=proxy)
```

### 3. Request Header Randomization

```python
import random

def get_random_headers():
    """Generate realistic request headers."""
    accept_languages = [
        'en-US,en;q=0.9',
        'en-GB,en;q=0.9',
        'en-US,en;q=0.8,es;q=0.7'
    ]
    
    return {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': random.choice(accept_languages),
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }

# Apply headers
page.set_extra_http_headers(get_random_headers())
```

---

## Handling CAPTCHAs

### 1. reCAPTCHA Detection

```python
def detect_recaptcha(page):
    """Check if reCAPTCHA is present."""
    recaptcha_frame = page.locator('iframe[src*="recaptcha"]')
    return recaptcha_frame.count() > 0

# Usage
if detect_recaptcha(page):
    print('⚠️ reCAPTCHA detected - manual intervention may be needed')
```

### 2. hCaptcha Handling

```python
def detect_hcaptcha(page):
    """Check if hCaptcha is present."""
    hcaptcha = page.locator('iframe[src*="hcaptcha"]')
    return hcaptcha.count() > 0
```

### 3. Cloudflare Challenge

```python
def handle_cloudflare(page, timeout=30000):
    """Wait for Cloudflare challenge to complete."""
    try:
        # Wait for challenge to appear
        cf_challenge = page.locator('#challenge-running, .cf-turnstile')
        if cf_challenge.count() > 0:
            print('⏳ Cloudflare challenge detected, waiting...')
            page.wait_for_selector('#challenge-running', state='hidden', timeout=timeout)
            print('✅ Cloudflare challenge passed')
            return True
    except Exception as e:
        print(f'❌ Cloudflare challenge failed: {e}')
        return False
    return True
```

---

## Complete Stealth Example

```python
# /tmp/playwright_stealth_full.py
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import random
import time

TARGET_URL = 'https://bot.sannysoft.com/'

def human_delay(min_ms=100, max_ms=500):
    delay = random.uniform(min_ms / 1000, max_ms / 1000)
    time.sleep(delay)

def human_scroll(page, distance=500):
    scroll_amount = random.randint(100, 300)
    scrolls_needed = distance // scroll_amount
    
    for _ in range(scrolls_needed):
        page.mouse.wheel(0, scroll_amount)
        time.sleep(random.uniform(0.1, 0.3))

with sync_playwright() as p:
    # Launch with stealth options
    browser = p.chromium.launch(
        headless=False,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-infobars',
        ]
    )
    
    # Create context with realistic settings
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale='en-US',
        timezone_id='America/New_York'
    )
    
    page = context.new_page()
    
    # Apply stealth
    stealth_sync(page)
    
    # Navigate with human-like behavior
    page.goto(TARGET_URL)
    human_delay(500, 1500)
    
    # Scroll to check all tests
    human_scroll(page, 2000)
    human_delay(1000, 2000)
    
    # Take screenshot of results
    page.screenshot(path='/tmp/stealth_results.png', full_page=True)
    print('📸 Screenshot saved to /tmp/stealth_results.png')
    
    # Keep browser open to review
    input('Press Enter to close browser...')
    
    browser.close()
```

---

## Checklist: Bot Detection Avoidance

| Technique | Implementation | Priority |
|-----------|---------------|----------|
| Playwright-stealth | `stealth_sync(page)` | ⭐⭐⭐ Critical |
| Disable automation flags | `--disable-blink-features=AutomationControlled` | ⭐⭐⭐ Critical |
| Realistic User Agent | Use `fake-useragent` library | ⭐⭐⭐ Critical |
| Human-like mouse movement | Custom bezier curve movement | ⭐⭐ High |
| Random delays | `human_delay()` function | ⭐⭐ High |
| Realistic scrolling | Incremental scroll with pauses | ⭐⭐ High |
| WebGL spoofing | Init script override | ⭐ Medium |
| Canvas noise | Init script noise injection | ⭐ Medium |
| Proxy rotation | Residential proxies | ⭐ Medium |
| Consistent timezone/location | Context configuration | ⭐⭐ High |
| Navigator overrides | Init script overrides | ⭐⭐ High |

---

## When Stealth Fails

If detection persists:
1. **Use residential proxies** - Most reliable evasion
2. **Reduce automation frequency** - Add longer delays
3. **Use undetected-chromedriver** - Alternative library
4. **Consider manual intervention** - For critical CAPTCHAs
5. **Rotate browser profiles** - Use persistent contexts with different profiles
6. **Check TLS fingerprint** - Some services detect TLS patterns

---

## References

- [Playwright-Stealth GitHub](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra)
- [Bot Detection Methods](https://github.com/nickyout/bot-detection-methods)
- [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs)
- [Are You Headless?](https://github.com/kkapsner/are-you-headless)