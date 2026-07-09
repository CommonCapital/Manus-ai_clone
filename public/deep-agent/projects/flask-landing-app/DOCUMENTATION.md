# Flask Landing-Page with Dynamic Proxy URL

**Project Documentation for Ijambo – Updated 2026-03-11**

---

## 1. Overview

When a Flask app is run inside the **sandbox proxy** (e.g., `http://127.0.0.1:<proxy_port>/proxy/5000`), static assets referenced with a leading slash (`/static/...`) bypass the proxy and cause **Bad Gateway** errors.

The solution is to **generate the full proxy-prefixed URL dynamically** inside the HTML template, so the link works regardless of the sandbox's proxy port or the internal Flask port.

---

## 2. How It Works

| Step | What Happens |
|------|--------------|
| **1. Detect request host** | `request.host_url` gives `http://127.0.0.1:<proxy_port>/`. |
| **2. Build base proxy URL** | Concatenate the host URL with `proxy/5000` (the internal Flask port). |
| **3. Inject into templates** | A Flask **context processor** adds `base_url` and `static_url` variables available in every template. |
| **4. Use in HTML** | `<link rel="stylesheet" href="{{ static_url }}/style.css">` renders as `http://127.0.0.1:<proxy_port>/proxy/5000/static/style.css`. |
| **5. No hard-coded ports** | When the sandbox is recreated, the new proxy port is automatically reflected without code changes. |

**Why this is needed**

Absolute URLs such as `/static/style.css` bypass the `/proxy/5000/` prefix, causing "Bad Gateway". By generating the full URL at runtime we guarantee the correct path regardless of the sandbox environment.

---

## 3. Implementation Details

### 3.1 `app.py`

```python
import os
from flask import Flask, render_template, request

app = Flask(__name__)

# ----------------------------------------------------------------------
# Context processor – runs for every template render
# ----------------------------------------------------------------------
@app.context_processor
def inject_proxy_urls():
    """
    Build URLs that include the sandbox proxy prefix.
    Example output when the sandbox proxy is 51295:
        base_url   = http://127.0.0.1:51295/proxy/5000
        static_url = http://127.0.0.1:51295/proxy/5000/static
    """
    # request.host_url gives something like "http://127.0.0.1:51295/"
    host_url = request.host_url.rstrip('/')          # remove trailing slash
    # The internal Flask port is always 5000 in our sandbox
    base_url = f"{host_url}/proxy/5000"
    static_url = f"{base_url}/static"
    return {"base_url": base_url, "static_url": static_url}

# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html")

# ----------------------------------------------------------------------
# Run the app (internal port 5000)
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # The sandbox forces the port; we keep it explicit for clarity.
    app.run(host="0.0.0.0", port=5000, debug=False)
```

**Key Points:**
- `request.host_url` reflects the **proxy** address (`http://127.0.0.1:<proxy_port>/`).
- The `context_processor` runs on *every* request, so the URLs stay up-to-date.
- No need to change Flask's `static_url_path`; the default (`/static`) works because the generated URL already includes the proxy prefix.

### 3.2 `templates/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home | Modern Website</title>

    <!-- Dynamic full URL for the stylesheet -->
    <link rel="stylesheet" href="{{ static_url }}/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">MyApp</div>
            <ul class="nav-links">
                <li><a href="#">Home</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h1>Welcome to MyApp</h1>
            <p>Your modern web application is running successfully!</p>
            <a href="#" class="cta-button">Get Started</a>
        </section>
    </main>

    <footer>
        <p>&copy; 2026 MyApp. All rights reserved.</p>
    </footer>
</body>
</html>
```

### 3.3 `static/style.css` (example)

```css
body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: #fff;
}
nav {
    display: flex;
    justify-content: space-between;
    padding: 1rem 2rem;
}
.logo {
    font-size: 1.5rem;
    font-weight: bold;
}
.nav-links li {
    display: inline;
    margin-left: 1rem;
}
.cta-button {
    display: inline-block;
    margin-top: 1rem;
    padding: .75rem 1.5rem;
    background: #fff;
    color: #2575fc;
    border-radius: .5rem;
    text-decoration: none;
}
```

---

## 4. Project Structure

```
flask-landing-app/
│
├─ project.md                     # Project metadata
├─ DOCUMENTATION.md               # This file
├─ requirements.txt               # (Flask)
│
├─ src/                           # Source code
│   ├─ app.py                     # Flask entry point with context processor
│   ├─ templates/
│   │   └─ index.html             # Uses {{ static_url }} for CSS
│   └─ static/
│       └─ style.css              # Your stylesheet
│
├─ sandbox-files/                 # Files exported from sandbox
│
└─ templates/                     # Reusable templates
    └─ flask-proxy-template/      # Template for future projects
```

---

## 5. How to Use This Template for Future Projects

1. **Copy the template folder** `templates/flask-proxy-template/` to a new location.
2. **Rename** the app (if desired) and adjust the HTML content.
3. **Add additional static assets** (JS, images) and reference them as  
   `{{ static_url }}/<filename>` inside any template.
4. **Add new routes** in `app.py` as usual; the context processor will keep the URLs correct automatically.
5. **Deploy**:
   ```bash
   pip install -r requirements.txt
   python app.py   # runs on internal port 5000
   ```
   The sandbox will expose it at `http://127.0.0.1:<proxy_port>/proxy/5000`.

---

## 6. Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Port-agnostic** | Works even if the sandbox changes its proxy port. |
| **No hard-coded URLs** | Eliminates maintenance headaches. |
| **Keeps Flask's native static handling** | No need for custom `static_url_path`. |
| **Reusable** | Same template can be dropped into any new Flask project that will be sandboxed. |
| **Automatic** | Context processor runs on every request, ensuring URLs are always correct. |

---

## 7. Optional Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Configuration file** (`config.py`) | Store `INTERNAL_PORT` and default `STATIC_SUBPATH` for easier tweaks. |
| **Unit tests** | Use Flask's test client to assert that `static_url` is rendered correctly. |
| **Dockerfile** | Containerize the app for local development outside the sandbox. |
| **CI workflow** | Auto-run linting (`flake8`) and tests on each commit. |
| **Documentation site** | Generate a small MkDocs site from the `README.md`. |
| **Asset versioning** | Add `?v={{ version }}` to static URLs for cache busting. |
| **Error handling page** | Custom 404/500 error handlers. |

---

## 8. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| CSS not loading | Static URL missing proxy prefix | Ensure `{{ static_url }}` is used in templates. |
| Bad Gateway on static files | Hard-coded `/static/` path | Replace with `{{ static_url }}/...` in HTML. |
| Context processor not running | Missing decorator | Verify `@app.context_processor` is present. |
| Wrong port in URL | Hard-coded port in code | Use `request.host_url` dynamically. |

---

## 9. Reference Summary (for quick copy-paste)

```markdown
# Project: Flask Landing-Page with Dynamic Proxy URL

## Goal
Serve a single-page Flask app that works inside the sandbox proxy without hard-coded static paths.

## Quick Start
1. Copy template folder
2. pip install -r requirements.txt
3. python app.py
4. Access via sandbox proxy URL
```

---

**Documentation Complete!**

This documentation fully describes the dynamic proxy URL solution and provides guidance for any future Flask project that needs to run inside the sandbox proxy environment.

For the reusable template, see `templates/flask-proxy-template/`.