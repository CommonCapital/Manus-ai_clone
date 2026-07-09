# Project: Flask Landing App

## Metadata
- **Created:** 2026-03-11
- **Updated:** 2026-03-11
- **User:** Ijambo
- **Type:** Flask Web Application
- **Status:** Completed
- **Feature:** Dynamic Proxy URL Support

## Description
A simple Flask web application with a landing page that includes **dynamic proxy URL generation** for seamless deployment in sandbox environments. The app automatically generates correct static asset URLs regardless of the sandbox's proxy port.

## Technology Stack
- Framework: Flask (Python)
- Language: Python 3.11
- Dependencies: Flask
- Feature: Context Processor for Dynamic URLs

## Key Feature: Dynamic Proxy URL Solution

### Problem Solved
When Flask apps run inside the sandbox proxy (`http://127.0.0.1:<proxy_port>/proxy/5000`), static assets referenced with `/static/...` bypass the proxy and cause **Bad Gateway** errors.

### Solution Implemented
A **Flask context processor** builds the full proxy-prefixed URL dynamically at runtime:
- `base_url` = `http://127.0.0.1:<proxy_port>/proxy/5000`
- `static_url` = `http://127.0.0.1:<proxy_port>/proxy/5000/static`

This ensures CSS, JS, and other assets load correctly even when the sandbox proxy port changes.

## Project Structure
```
flask-landing-app/
├── project.md              # This file
├── DOCUMENTATION.md        # Comprehensive implementation docs
├── todos/                  # Project todos
├── src/                    # Source code
│   ├── app.py             # Flask application with context processor
│   ├── templates/         # HTML templates
│   │   └── index.html     # Uses {{ static_url }} for assets
│   └── static/            # CSS, JS, images
│       └── style.css
├── sandbox-files/         # Exported sandbox files
├── templates/             # Reusable template for future projects
│   └── flask-proxy-template/
└── requirements.txt       # Dependencies
```

## Endpoints / URLs
- Internal Port: 5000
- Sandbox: `http://127.0.0.1:<proxy_port>/proxy/5000`
- Static Assets: `{{ static_url }}/style.css` → `http://127.0.0.1:<proxy_port>/proxy/5000/static/style.css`

## Usage

### Running in Sandbox
```bash
pip install -r requirements.txt
python app.py
# Access via: http://127.0.0.1:<proxy_port>/proxy/5000
```

### Using the Template for New Projects
Copy the `templates/flask-proxy-template/` folder to start a new Flask project with dynamic proxy URL support pre-configured.

## Notes
- Landing page Flask app with dynamic proxy URL support
- Works seamlessly in sandbox environments
- No hard-coded proxy ports required
- See DOCUMENTATION.md for full implementation details