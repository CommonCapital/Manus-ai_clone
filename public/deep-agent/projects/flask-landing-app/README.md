# Flask Landing App

## Overview
A simple Flask web application with a landing page that works correctly behind the sandbox proxy environment. This project demonstrates the **dynamic proxy URL solution** for static assets.

## Problem Solved
When Flask apps run inside the sandbox proxy (`http://127.0.0.1:<proxy_port>/proxy/5000`), static assets referenced with leading slashes (`/static/...`) bypass the proxy prefix and cause **Bad Gateway** errors.

## Solution
A context processor that dynamically generates the full proxy-prefixed URL at runtime, ensuring static assets load correctly regardless of the sandbox's proxy port.

## Quick Start
```bash
# Installation
pip install -r requirements.txt

# Run (internal port 5000)
python src/app.py

# Access via sandbox proxy
# http://127.0.0.1:<proxy_port>/proxy/5000
```

## Project Structure
```
flask-landing-app/
├── README.md              # This file
├── project.md             # Project metadata
├── DOCUMENTATION.md       # Detailed technical documentation
├── requirements.txt       # Python dependencies
├── todos/                 # Project-specific todo lists
├── src/                   # Source code
│   ├── app.py            # Flask app with context processor
│   ├── templates/        # HTML templates
│   └── static/           # Static assets (CSS, JS)
├── templates/             # Reusable Flask templates
│   └── flask-proxy-template/
└── sandbox-files/         # Exported sandbox files
```

## Technology Stack
- Framework: Flask
- Language: Python
- Dependencies: Flask

## Key Implementation

### Context Processor (app.py)
```python
@app.context_processor
def inject_proxy_urls():
    host_url = request.host_url.rstrip('/')
    base_url = f"{host_url}/proxy/5000"
    static_url = f"{base_url}/static"
    return {"base_url": base_url, "static_url": static_url}
```

### Template Usage (index.html)
```html
<link rel="stylesheet" href="{{ static_url }}/style.css">
```

## URLs
- Local: http://localhost:5000
- Sandbox: http://127.0.0.1:<proxy_port>/proxy/5000

## Created
- Date: 2026-03-11
- User: Ijambo

## Notes
- This project serves as a template for future Flask projects that need to run behind a proxy
- The `templates/flask-proxy-template/` folder contains a ready-to-copy template for new projects
- See `DOCUMENTATION.md` for detailed implementation guide

## Related Files
- `DOCUMENTATION.md` - Comprehensive documentation
- `templates/flask-proxy-template/` - Reusable template for new projects