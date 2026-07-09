# Flask Proxy Template

A reusable Flask template with built-in dynamic proxy URL support for sandbox environments.

## Purpose

This template provides a ready-to-use Flask application structure that automatically generates correct static asset URLs when deployed in sandbox proxy environments. No more hard-coded ports or Bad Gateway errors!

## Features

- ✅ Dynamic proxy URL generation via context processor
- ✅ Works with any sandbox proxy port
- ✅ Clean project structure
- ✅ Ready-to-customize landing page
- ✅ No code changes needed when proxy port changes

## Quick Start

1. **Copy this folder** to your new project location
2. **Rename** the project folder as desired
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the app**:
   ```bash
   python app.py
   ```
5. **Access via sandbox**: Open the provided sandbox URL

## Project Structure

```
flask-proxy-template/
├── app.py              # Flask app with context processor
├── requirements.txt    # Dependencies (Flask)
├── README.md           # This file
├── templates/
│   └── index.html      # Landing page template
└── static/
    └── style.css       # Default stylesheet
```

## How It Works

The `app.py` includes a context processor that automatically injects `base_url` and `static_url` variables into all templates:

```python
@app.context_processor
def inject_proxy_urls():
    host_url = request.host_url.rstrip('/')
    base_url = f"{host_url}/proxy/5000"
    static_url = f"{base_url}/static"
    return {"base_url": base_url, "static_url": static_url}
```

In your HTML templates, use:
```html
<link rel="stylesheet" href="{{ static_url }}/style.css">
<script src="{{ static_url }}/main.js"></script>
<img src="{{ static_url }}/images/logo.png">
```

## Customization

### Adding New Routes

Edit `app.py` to add new routes:
```python
@app.route("/about")
def about():
    return render_template("about.html")
```

### Adding Static Assets

1. Place files in the `static/` folder
2. Reference them in templates using `{{ static_url }}/filename`

### Changing the Internal Port

If you need to use a different internal port:
1. Update `app.run(port=5000)` in `app.py`
2. Update the context processor: `base_url = f"{host_url}/proxy/YOUR_PORT"`

## Requirements

- Python 3.8+
- Flask 3.0+

## License

Free to use for any project.

---

Created for Ijambo – 2026