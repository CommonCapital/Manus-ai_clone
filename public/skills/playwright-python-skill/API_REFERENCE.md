# Playwright Python API Reference

Complete reference for Playwright Python automation.

## Table of Contents

1. [Browser Launch Options](#browser-launch-options)
2. [Page Navigation](#page-navigation)
3. [Selectors & Locators](#selectors--locators)
4. [Actions](#actions)
5. [Assertions](#assertions)
6. [Waiting](#waiting)
7. [Screenshots & PDFs](#screenshots--pdfs)
8. [Network](#network)
9. [Dialogs & Popups](#dialogs--popups)
10. [Frames & Iframes](#frames--iframes)
11. [Accessibility](#accessibility)
12. [Tracing & Debugging](#tracing--debugging)

---

## Browser Launch Options

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Basic launch
    browser = p.chromium.launch()
    
    # With options
    browser = p.chromium.launch(
        headless=False,           # Show browser window
        slow_mo=100,              # Slow down actions by 100ms
        devtools=True,            # Open DevTools
        downloads_path='/tmp',     # Download directory
        args=[
            '--start-maximized',   # Start maximized
            '--disable-extensions'
        ]
    )
    
    # Different browsers
    firefox = p.firefox.launch()
    webkit = p.webkit.launch()
    
    # Connect to existing browser
    browser = p.chromium.connect_over_cdp('http://localhost:9222')
```

### Common Launch Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | bool | True | Run without visible window |
| `slow_mo` | int | 0 | Slow down each action by ms |
| `devtools` | bool | False | Auto-open DevTools |
| `timeout` | int | 30000 | Launch timeout in ms |
| `downloads_path` | str | None | Path for downloads |
| `proxy` | dict | None | Proxy settings |

---

## Page Navigation

```python
# Basic navigation
page.goto('https://example.com')

# With options
page.goto(
    'https://example.com',
    wait_until='networkidle',  # 'load', 'domcontentloaded', 'networkidle'
    timeout=30000,
    referer='https://referer.com'
)

# Go back/forward
page.go_back()
page.go_forward()

# Reload
page.reload()
page.reload(wait_until='networkidle')

# Current URL
current_url = page.url
```

---

## Selectors & Locators

### CSS Selectors

```python
# By tag
page.locator('button')

# By class
page.locator('.submit-btn')

# By ID
page.locator('#login-form')

# By attribute
page.locator('[data-testid="submit"]')
page.locator('input[type="email"]')

# Combinations
page.locator('form.login input.email')
page.locator('div.card > h2')
```

### Text Selectors

```python
# Exact text
page.locator('text=Submit')
page.locator('text="Submit Form"')  # Exact match with quotes

# Contains text
page.locator('text=/Submit/i')  # Regex, case insensitive

# By role and text
page.get_by_role('button', name='Submit')
page.get_by_text('Welcome')
```

### Role-based Selectors (Recommended)

```python
# ARIA roles - more resilient
page.get_by_role('button')
page.get_by_role('textbox')
page.get_by_role('link', name='Home')
page.get_by_role('heading', level=2)
page.get_by_role('checkbox', checked=True)

# Get by label (for form fields)
page.get_by_label('Email Address')
page.get_by_placeholder('Enter your email')
page.get_by_test_id('submit-button')
```

### Locator Operations

```python
# Get all matching elements
buttons = page.locator('button').all()

# Get nth element
page.locator('li').nth(0)
page.locator('li').first
page.locator('li').last

# Filter locators
page.locator('li').filter(has_text='Active')
page.locator('ul').filter(has=page.locator('.selected'))

# Chain locators
page.locator('form').locator('button.submit')

# Count
count = page.locator('li').count()

# Check if visible
is_visible = page.locator('h1').is_visible()
```

---

## Actions

### Click

```python
# Simple click
page.click('button')
page.locator('button').click()

# Click options
page.click('button', 
    button='right',      # 'left', 'right', 'middle'
    click_count=2,       # Double click
    delay=100,           # Delay between mousedown and mouseup
    force=True,          # Skip actionability checks
    position={'x': 10, 'y': 20},  # Click at specific position
    modifiers=['Shift']  # Hold modifier keys
)

# Double click
page.dblclick('.item')
```

### Fill & Type

```python
# Fill (clears first, faster)
page.fill('input[name="email"]', 'test@example.com')

# Type (character by character, triggers events)
page.type('input[name="email"]', 'test@example.com', delay=100)

# Clear
page.fill('input[name="email"]', '')

# Press key
page.press('input', 'Enter')
page.press('input', 'Control+a')  # Select all
page.press('input', 'ArrowDown')
```

### Select Options

```python
# Select by value
page.select_option('select', 'option1')

# Select by label
page.select_option('select', label='Option One')

# Select multiple
page.select_option('select', ['value1', 'value2'])

# Select by index
page.select_option('select', index=0)
```

### Check/Uncheck

```python
# Checkbox
page.check('input[type="checkbox"]')
page.uncheck('input[type="checkbox"]')

# Radio button
page.check('input[value="option1"]')

# Verify state
assert page.is_checked('input[type="checkbox"]')
```

### Focus & Blur

```python
page.focus('input')
page.locator('input').blur()
```

### Drag & Drop

```python
# Drag and drop
page.drag_and_drop('#source', '#target')

# Manual drag
page.hover('#source')
page.mouse.down()
page.hover('#target')
page.mouse.up()
```

### Hover

```python
page.hover('.menu-item')
page.hover('.menu-item', position={'x': 10, 'y': 5})
```

---

## Assertions

```python
from playwright.sync_api import expect

# Text content
expect(page.locator('h1')).to_have_text('Welcome')
expect(page.locator('h1')).to_contain_text('Welcome')

# Visibility
expect(page.locator('.alert')).to_be_visible()
expect(page.locator('.hidden')).to_be_hidden()

# Enabled/disabled
expect(page.locator('button')).to_be_enabled()
expect(page.locator('button')).to_be_disabled()

# Editable
expect(page.locator('input')).to_be_editable()

# Checked
expect(page.locator('checkbox')).to_be_checked()

# Count
expect(page.locator('li')).to_have_count(5)

# Value
expect(page.locator('input')).to_have_value('test@example.com')

# Attribute
expect(page.locator('a')).to_have_attribute('href', '/home')

# CSS class
expect(page.locator('div')).to_have_class('active')

# URL
expect(page).to_have_url('https://example.com')
expect(page).to_have_url(re.compile(r'example\.com'))

# Title
expect(page).to_have_title('Page Title')
```

---

## Waiting

```python
# Wait for selector
page.wait_for_selector('.loaded')
page.wait_for_selector('.loading', state='hidden')

# Wait for navigation
with page.expect_navigation():
    page.click('a[href="/page2"]')

# Wait for URL
page.wait_for_url('**/dashboard')
page.wait_for_url(re.compile(r'/dashboard/\d+'))

# Wait for load state
page.wait_for_load_state('domcontentloaded')
page.wait_for_load_state('networkidle')

# Wait for timeout (avoid if possible)
page.wait_for_timeout(1000)

# Wait for function
page.wait_for_function('document.querySelector(".status").textContent === "Ready"')

# Wait for request/response
with page.expect_request('**/api/data') as req:
    page.click('button')
request = req.value

# Wait for response
response = page.wait_for_response('**/api/data')
```

---

## Screenshots & PDFs

### Screenshots

```python
# Full page
page.screenshot(path='/tmp/screenshot.png', full_page=True)

# Viewport only
page.screenshot(path='/tmp/screenshot.png')

# Specific element
page.locator('.card').screenshot(path='/tmp/card.png')

# Return as bytes
screenshot_bytes = page.screenshot()

# With options
page.screenshot(
    path='/tmp/screenshot.png',
    full_page=True,
    type='jpeg',           # 'png', 'jpeg', 'webp'
    quality=80,            # For jpeg/webp
    omit_background=True,  # Transparent background
    clip={'x': 0, 'y': 0, 'width': 100, 'height': 100}
)
```

### PDFs

```python
# Generate PDF
page.pdf(path='/tmp/page.pdf')

# With options
page.pdf(
    path='/tmp/page.pdf',
    format='A4',
    print_background=True,
    margin={
        'top': '20px',
        'right': '20px',
        'bottom': '20px',
        'left': '20px'
    },
    scale=0.9  # 0.1 to 2
)
```

---

## Network

### Intercept Requests

```python
def handle_route(route):
    # Modify request
    headers = route.request.headers.copy()
    headers['X-Custom'] = 'value'
    
    route.continue_(headers=headers)
    
    # Or fulfill with custom response
    # route.fulfill(status=200, body='Custom response')
    
    # Or abort
    # route.abort()

page.route('**/api/**', handle_route)
```

### Mock API Responses

```python
def mock_api(route):
    route.fulfill(
        status=200,
        content_type='application/json',
        body='{"status": "success"}'
    )

page.route('**/api/users', mock_api)
```

### Network Events

```python
# Log all requests
page.on('request', lambda req: print(f'>> {req.method} {req.url}'))

# Log all responses
page.on('response', lambda res: print(f'<< {res.status} {res.url}'))

# Handle request failures
page.on('requestfailed', lambda req: print(f'Failed: {req.url}'))
```

### Make Requests from Page

```python
# GET request
response = page.request.get('https://api.example.com/data')
data = response.json()

# POST request
response = page.request.post(
    'https://api.example.com/users',
    data={'name': 'John', 'email': 'john@example.com'}
)

# With headers
response = page.request.get(
    'https://api.example.com/data',
    headers={'Authorization': 'Bearer token'}
)
```

---

## Dialogs & Popups

### Alert Dialogs

```python
def handle_dialog(dialog):
    print(f'Dialog message: {dialog.message}')
    dialog.accept()  # or dialog.dismiss()

page.on('dialog', handle_dialog)
page.click('button')  # Triggers alert
```

### New Pages/Popups

```python
# Wait for popup
with page.expect_popup() as popup_info:
    page.click('a[target="_blank"]')
popup = popup_info.value

# Or use event
def handle_popup(popup):
    print(f'New page: {popup.url}')
    popup.close()

page.on('popup', handle_popup)
```

### File Downloads

```python
# Wait for download
with page.expect_download() as download_info:
    page.click('a[download]')
download = download_info.value

# Save download
download.save_as('/tmp/downloaded_file.pdf')

# Get suggested name
print(download.suggested_filename)
```

### File Uploads

```python
# Set file for input
page.set_input_files('input[type="file"]', '/path/to/file.pdf')

# Multiple files
page.set_input_files('input[type="file"]', ['/file1.pdf', '/file2.pdf'])

# Remove files
page.set_input_files('input[type="file"]', [])
```

---

## Frames & Iframes

```python
# Get frame by name or URL
frame = page.frame(name='myframe')
frame = page.frame(url=re.compile(r'frame\.html'))

# Get frame locator
frame = page.frame_locator('iframe').content_frame()

# Work within frame
frame.fill('input', 'value')
frame.click('button')

# Frame locator (recommended)
page.frame_locator('iframe').locator('button').click()
```

---

## Accessibility

```python
# Get accessibility tree
snapshot = page.accessibility.snapshot()

# Find element in tree
def find_node(node, name):
    if node.get('name') == name:
        return node
    for child in node.get('children', []):
        result = find_node(child, name)
        if result:
            return result
    return None

# Check for accessible name
login_button = find_node(snapshot, 'Login')
assert login_button is not None
```

---

## Tracing & Debugging

### Playwright Inspector

```python
# Open inspector (pauses execution)
page.pause()

# Or launch with PWDEBUG
# PWDEBUG=1 python script.py
```

### Tracing

```python
# Start tracing
browser.start_tracing(page, path='trace.json', screenshots=True)

# ... perform actions ...

# Stop tracing
browser.stop_tracing()

# View trace: npx playwright show-trace trace.json
```

### Console Logs

```python
# Capture console
page.on('console', lambda msg: print(f'{msg.type}: {msg.text}'))

# Capture errors
page.on('pageerror', lambda err: print(f'Error: {err}'))
```

### Video Recording

```python
# Enable video in context
context = browser.new_context(
    record_video_dir='/tmp/videos/'
)
page = context.new_page()

# ... perform actions ...

# Save video
page.close()
video_path = page.video.path()
```

---

## Context & Browser Management

```python
# Create isolated context (like incognito)
context = browser.new_context(
    viewport={'width': 1920, 'height': 1080},
    user_agent='Custom User Agent',
    locale='en-US',
    timezone_id='America/New_York',
    geolocation={'latitude': 40.7128, 'longitude': -74.0060},
    permissions=['geolocation'],
    ignore_https_errors=True,
    accept_downloads=True
)

# Multiple pages in context
page1 = context.new_page()
page2 = context.new_page()

# Storage state (cookies, localStorage)
context.storage_state(path='state.json')
context = browser.new_context(storage_state='state.json')

# Clear cookies
context.clear_cookies()

# Close everything
page.close()
context.close()
browser.close()
```

---

## Quick Reference

| Task | Method |
|------|--------|
| Navigate | `page.goto(url)` |
| Click | `page.click(selector)` |
| Fill | `page.fill(selector, value)` |
| Type | `page.type(selector, value)` |
| Select | `page.select_option(selector, value)` |
| Check | `page.check(selector)` |
| Hover | `page.hover(selector)` |
| Wait | `page.wait_for_selector(selector)` |
| Screenshot | `page.screenshot(path)` |
| Get text | `page.locator(selector).text_content()` |
| Get attribute | `page.locator(selector).get_attribute(name)` |
| Assert | `expect(locator).to_be_visible()` |

---

## Stealth & Bot Detection Avoidance

### Basic Stealth Setup

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=['--disable-blink-features=AutomationControlled']
    )
    page = browser.new_page()
    stealth_sync(page)  # Apply stealth patches
    
    page.goto('https://example.com')
    browser.close()
```

### Stealth Launch Options

```python
browser = p.chromium.launch(
    headless=False,
    args=[
        '--disable-blink-features=AutomationControlled',  # Critical!
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--disable-browser-side-navigation',
        '--disable-gpu',
    ]
)
```

### Realistic Context Configuration

```python
context = browser.new_context(
    viewport={'width': 1920, 'height': 1080},
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale='en-US',
    timezone_id='America/New_York',
    geolocation={'latitude': 40.7128, 'longitude': -74.0060},
    permissions=['geolocation'],
)
```

### Human Behavior Helpers

```python
from lib.helpers import (
    human_delay,
    human_scroll,
    human_like_type,
    simulate_browsing,
    detect_captcha,
    wait_for_cloudflare
)

# Random delay
human_delay(100, 500)  # 100-500ms

# Natural scrolling
human_scroll(page, 'down', 1000)

# Human-like typing
human_like_type(page, 'input[name="email"]', 'test@example.com')

# Simulate browsing session
simulate_browsing(page, duration_seconds=30)

# Detect CAPTCHA
captcha_type = detect_captcha(page)
if captcha_type:
    print(f'⚠️ {captcha_type} detected')

# Handle Cloudflare
if not wait_for_cloudflare(page, timeout=30000):
    print('❌ Cloudflare challenge failed')
```

### Proxy Configuration

```python
# Basic proxy
browser = p.chromium.launch(
    proxy={
        'server': 'http://proxy.example.com:8080',
        'username': 'user',
        'password': 'pass'
    }
)

# Residential proxy (recommended for stealth)
browser = p.chromium.launch(
    proxy={
        'server': 'http://gate.smartproxy.com:7000',
        'username': 'username',
        'password': 'password'
    }
)
```

### Navigator Overrides (Init Scripts)

```python
async def apply_navigator_overrides(page):
    await page.add_init_script("""
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }
            ]
        });
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
    """)
```

### Detection Test Sites

| Site | Purpose |
|------|---------|
| https://bot.sannysoft.com/ | Comprehensive bot detection test |
| https://arh.antoinevastel.com/bots/areyouheadless | Headless detection |
| https://pixelscan.net/ | Browser fingerprinting |
| https://www.browserscan.net/bot-detection | Bot detection suite |

### Complete Stealth Example

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import sys
sys.path.append('$SKILL_DIR')
from lib.helpers import (
    human_delay, human_scroll, get_stealth_launch_args,
    get_realistic_user_agent, get_realistic_viewport
)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=get_stealth_launch_args()
    )
    
    context = browser.new_context(
        viewport=get_realistic_viewport(),
        user_agent=get_realistic_user_agent(),
        locale='en-US',
        timezone_id='America/New_York'
    )
    
    page = context.new_page()
    stealth_sync(page)
    
    page.goto('https://bot.sannysoft.com/')
    human_delay(500, 1500)
    human_scroll(page, 'down', 2000)
    
    page.screenshot(path='/tmp/stealth_results.png', full_page=True)
    browser.close()
```

> **See STEALTH.md for comprehensive bot detection avoidance documentation.**