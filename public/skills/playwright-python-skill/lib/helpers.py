"""
Playwright Python Skill - Helper Functions

Utility functions for common Playwright automation tasks.
"""

import socket
import time
import json
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse


# Common dev server ports to check
DEV_SERVER_PORTS = [3000, 3001, 3002, 4000, 5000, 5001, 5173, 5174, 8000, 8080, 8888]


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    """Check if a port is open on the given host."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            result = s.connect_ex((host, port))
            return result == 0
    except (socket.error, socket.timeout):
        return False


def detect_dev_servers(host: str = 'localhost') -> List[Dict[str, Any]]:
    """
    Detect running development servers on common ports.
    
    Returns a list of detected servers with their URLs and port info.
    """
    detected = []
    
    for port in DEV_SERVER_PORTS:
        if is_port_open(host, port):
            url = f'http://{host}:{port}'
            detected.append({
                'url': url,
                'port': port,
                'host': host
            })
    
    return detected


def wait_for_server(
    url: str,
    timeout: float = 30.0,
    interval: float = 0.5
) -> bool:
    """
    Wait for a server to become available.
    
    Args:
        url: The URL to check (e.g., 'http://localhost:3000')
        timeout: Maximum time to wait in seconds
        interval: Time between checks in seconds
    
    Returns:
        True if server became available, False if timeout
    """
    parsed = urlparse(url)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 80
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if is_port_open(host, port):
            return True
        time.sleep(interval)
    
    return False


def safe_goto(
    page,
    url: str,
    timeout: float = 30000,
    retries: int = 3,
    wait_until: str = 'load',
    **kwargs
) -> bool:
    """
    Navigate to a URL with error handling and retries.
    
    Args:
        page: Playwright page object
        url: URL to navigate to
        timeout: Timeout in milliseconds
        retries: Number of retry attempts
        wait_until: When to consider navigation complete
        **kwargs: Additional arguments for page.goto()
    
    Returns:
        True if navigation succeeded, False otherwise
    """
    last_error = None
    
    for attempt in range(retries):
        try:
            page.goto(url, timeout=timeout, wait_until=wait_until, **kwargs)
            return True
        except Exception as e:
            last_error = e
            print(f"⚠️ Navigation attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(1)
    
    print(f"❌ All navigation attempts failed. Last error: {last_error}")
    return False


def capture_artifacts(
    page,
    prefix: str = 'debug',
    output_dir: str = '/tmp'
) -> Dict[str, str]:
    """
    Capture debugging artifacts (screenshot and HTML dump).
    
    Args:
        page: Playwright page object
        prefix: Prefix for output filenames
        output_dir: Directory to save artifacts
    
    Returns:
        Dictionary with paths to captured artifacts
    """
    artifacts = {}
    
    # Capture screenshot
    screenshot_path = f"{output_dir}/{prefix}_screenshot.png"
    try:
        page.screenshot(path=screenshot_path, full_page=True)
        artifacts['screenshot'] = screenshot_path
        print(f"📸 Screenshot saved: {screenshot_path}")
    except Exception as e:
        print(f"⚠️ Failed to capture screenshot: {e}")
    
    # Capture HTML
    html_path = f"{output_dir}/{prefix}_page.html"
    try:
        html_content = page.content()
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        artifacts['html'] = html_path
        print(f"📄 HTML saved: {html_path}")
    except Exception as e:
        print(f"⚠️ Failed to capture HTML: {e}")
    
    # Capture URL and title
    try:
        artifacts['url'] = page.url
        artifacts['title'] = page.title()
    except:
        pass
    
    return artifacts


def get_console_logs(page) -> List[str]:
    """
    Capture console logs from the page.
    
    Args:
        page: Playwright page object
    
    Returns:
        List of console log messages
    """
    logs = []
    
    def handle_console(msg):
        logs.append(f"[{msg.type}] {msg.text}")
    
    page.on('console', handle_console)
    return logs


def check_element_exists(page, selector: str) -> bool:
    """
    Check if an element exists on the page.
    
    Args:
        page: Playwright page object
        selector: CSS selector to check
    
    Returns:
        True if element exists, False otherwise
    """
    try:
        count = page.locator(selector).count()
        return count > 0
    except:
        return False


def wait_and_click(
    page,
    selector: str,
    timeout: float = 10000
) -> bool:
    """
    Wait for an element and click it.
    
    Args:
        page: Playwright page object
        selector: CSS selector for the element
        timeout: Timeout in milliseconds
    
    Returns:
        True if click succeeded, False otherwise
    """
    try:
        page.wait_for_selector(selector, timeout=timeout)
        page.click(selector)
        return True
    except Exception as e:
        print(f"⚠️ Failed to click {selector}: {e}")
        return False


def get_all_links(page) -> List[Dict[str, str]]:
    """
    Get all links from the page with their href and text.
    
    Args:
        page: Playwright page object
    
    Returns:
        List of dictionaries with 'href' and 'text' keys
    """
    links = []
    elements = page.locator('a[href]').all()
    
    for el in elements:
        try:
            href = el.get_attribute('href')
            text = el.text_content()
            links.append({'href': href, 'text': text.strip() if text else ''})
        except:
            continue
    
    return links


def fill_form(
    page,
    fields: Dict[str, str],
    submit_selector: Optional[str] = None
) -> bool:
    """
    Fill multiple form fields and optionally submit.
    
    Args:
        page: Playwright page object
        fields: Dictionary mapping selectors to values
        submit_selector: Optional selector for submit button
    
    Returns:
        True if all fields filled successfully
    """
    success = True
    
    for selector, value in fields.items():
        try:
            page.fill(selector, value)
        except Exception as e:
            print(f"⚠️ Failed to fill {selector}: {e}")
            success = False
    
    if submit_selector and success:
        try:
            page.click(submit_selector)
        except Exception as e:
            print(f"⚠️ Failed to click submit: {e}")
            success = False
    
    return success


# Utility to pretty print detected servers
def print_detected_servers(servers: List[Dict[str, Any]]) -> None:
    """Pretty print the list of detected servers."""
    if not servers:
        print("❌ No dev servers detected")
        return
    
    print("✅ Detected dev servers:")
    for server in servers:
        print(f"   - {server['url']} (port {server['port']})")


if __name__ == '__main__':
    # Test the detection
    servers = detect_dev_servers()
    print_detected_servers(servers)


# =============================================================================
# STEALTH & BOT DETECTION AVOIDANCE HELPERS
# =============================================================================

import random
import time as time_module
from typing import Tuple, Optional


def human_delay(min_ms: int = 100, max_ms: int = 500) -> None:
    """
    Add a random human-like delay.
    
    Args:
        min_ms: Minimum delay in milliseconds
        max_ms: Maximum delay in milliseconds
    """
    delay = random.uniform(min_ms / 1000, max_ms / 1000)
    time_module.sleep(delay)


def typing_delay() -> float:
    """
    Get a realistic typing delay between keystrokes.
    
    Returns:
        Delay in seconds (typically 50-150ms)
    """
    return random.uniform(0.05, 0.15)


def human_scroll(page, direction: str = 'down', distance: int = 500) -> None:
    """
    Scroll in a human-like manner with pauses.
    
    Args:
        page: Playwright page object
        direction: 'down' or 'up'
        distance: Total distance to scroll in pixels
    """
    scroll_amount = random.randint(100, 200)
    scrolls_needed = max(1, distance // scroll_amount)
    
    for _ in range(scrolls_needed):
        if direction == 'down':
            page.mouse.wheel(0, scroll_amount)
        else:
            page.mouse.wheel(0, -scroll_amount)
        
        # Random pause between scrolls
        time_module.sleep(random.uniform(0.1, 0.3))
    
    # Occasional pause to "read"
    if random.random() > 0.7:
        time_module.sleep(random.uniform(0.5, 1.5))


def human_like_type(page, selector: str, text: str, delay_range: Tuple[float, float] = (0.05, 0.15)) -> None:
    """
    Type text in a human-like manner with random delays.
    
    Args:
        page: Playwright page object
        selector: Element selector to type into
        text: Text to type
        delay_range: Tuple of (min, max) delay in seconds
    """
    page.click(selector)
    human_delay(100, 300)
    
    for char in text:
        page.keyboard.type(char, delay=int(random.uniform(*delay_range) * 1000))


def get_stealth_launch_args() -> List[str]:
    """
    Get recommended browser launch arguments for stealth mode.
    
    Returns:
        List of command-line arguments for chromium.launch()
    """
    return [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--disable-browser-side-navigation',
        '--disable-gpu',
    ]


def get_realistic_user_agent(browser: str = 'chrome') -> str:
    """
    Get a realistic user agent string.
    
    Args:
        browser: 'chrome', 'firefox', or 'safari'
    
    Returns:
        User agent string
    """
    agents = {
        'chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'chrome_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'firefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'safari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    }
    return agents.get(browser, agents['chrome'])


def get_realistic_viewport() -> Dict[str, int]:
    """
    Get a realistic viewport size.
    
    Returns:
        Dict with 'width' and 'height'
    """
    viewports = [
        {'width': 1920, 'height': 1080},  # Full HD
        {'width': 1366, 'height': 768},   # Common laptop
        {'width': 1536, 'height': 864},   # Common desktop
        {'width': 1440, 'height': 900},   # MacBook
    ]
    return random.choice(viewports)


def create_stealth_context(browser, **kwargs) -> Any:
    """
    Create a browser context with stealth settings.
    
    Args:
        browser: Playwright browser object
        **kwargs: Additional context options
    
    Returns:
        Browser context with stealth configuration
    """
    defaults = {
        'viewport': get_realistic_viewport(),
        'user_agent': get_realistic_user_agent(),
        'locale': 'en-US',
        'timezone_id': 'America/New_York',
    }
    defaults.update(kwargs)
    return browser.new_context(**defaults)


def apply_stealth_async(page) -> None:
    """
    Apply stealth patches using playwright-stealth (async version).
    
    Args:
        page: Playwright page object
    """
    try:
        from playwright_stealth import stealth_async
        import asyncio
        asyncio.get_event_loop().run_until_complete(stealth_async(page))
    except ImportError:
        print("⚠️ playwright-stealth not installed. Run: pip install playwright-stealth")


def apply_stealth_sync(page) -> None:
    """
    Apply stealth patches using playwright-stealth (sync version).
    
    Args:
        page: Playwright page object
    """
    try:
        from playwright_stealth import stealth_sync
        stealth_sync(page)
    except ImportError:
        print("⚠️ playwright-stealth not installed. Run: pip install playwright-stealth")


def simulate_browsing(page, duration_seconds: int = 30) -> None:
    """
    Simulate natural browsing behavior for a duration.
    
    Args:
        page: Playwright page object
        duration_seconds: How long to simulate browsing
    """
    start_time = time_module.time()
    
    while time_module.time() - start_time < duration_seconds:
        action = random.choice(['scroll', 'move', 'pause'])
        
        if action == 'scroll':
            human_scroll(page, random.choice(['down', 'up']), random.randint(200, 600))
        elif action == 'move':
            viewport = page.viewport_size or {'width': 1920, 'height': 1080}
            x = random.randint(0, viewport['width'])
            y = random.randint(0, viewport['height'])
            page.mouse.move(x, y)
        elif action == 'pause':
            time_module.sleep(random.uniform(1, 3))
        
        time_module.sleep(random.uniform(0.5, 2))


def detect_captcha(page) -> Optional[str]:
    """
    Detect if a CAPTCHA is present on the page.
    
    Args:
        page: Playwright page object
    
    Returns:
        'recaptcha', 'hcaptcha', 'cloudflare', or None
    """
    # Check for reCAPTCHA
    if page.locator('iframe[src*="recaptcha"]').count() > 0:
        return 'recaptcha'
    
    # Check for hCaptcha
    if page.locator('iframe[src*="hcaptcha"]').count() > 0:
        return 'hcaptcha'
    
    # Check for Cloudflare
    if page.locator('#challenge-running, .cf-turnstile').count() > 0:
        return 'cloudflare'
    
    return None


def wait_for_cloudflare(page, timeout: int = 30000) -> bool:
    """
    Wait for Cloudflare challenge to complete.
    
    Args:
        page: Playwright page object
        timeout: Maximum wait time in milliseconds
    
    Returns:
        True if challenge passed, False otherwise
    """
    try:
        challenge = page.locator('#challenge-running')
        if challenge.count() > 0:
            print('⏳ Cloudflare challenge detected, waiting...')
            challenge.wait_for(state='hidden', timeout=timeout)
            print('✅ Cloudflare challenge passed')
            return True
    except Exception as e:
        print(f'❌ Cloudflare challenge failed: {e}')
        return False
    return True