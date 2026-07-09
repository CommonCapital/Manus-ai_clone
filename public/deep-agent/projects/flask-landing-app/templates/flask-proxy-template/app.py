"""
Flask App with Dynamic Proxy URL Support
=========================================

This template provides a Flask application with built-in support for sandbox
proxy environments. The context processor automatically generates correct URLs
for static assets regardless of the sandbox's proxy port.

Usage:
    1. Install dependencies: pip install -r requirements.txt
    2. Run the app: python app.py
    3. Access via sandbox proxy URL

Author: Template for Ijambo
Date: 2026-03-11
"""

import os
from flask import Flask, render_template, request

app = Flask(__name__)

# =============================================================================
# Context Processor - Dynamic Proxy URL Generation
# =============================================================================

@app.context_processor
def inject_proxy_urls():
    """
    Build URLs that include the sandbox proxy prefix.
    
    This context processor runs on every request and injects two variables
    into all templates:
    
    - base_url: The full URL including proxy prefix (e.g., http://127.0.0.1:51295/proxy/5000)
    - static_url: The full URL for static files (e.g., http://127.0.0.1:51295/proxy/5000/static)
    
    Example usage in templates:
        <link rel="stylesheet" href="{{ static_url }}/style.css">
        <script src="{{ static_url }}/main.js"></script>
        <img src="{{ static_url }}/images/logo.png">
    
    Returns:
        dict: Dictionary with base_url and static_url variables
    """
    # Get the host URL from the request (includes the proxy port)
    # e.g., "http://127.0.0.1:51295/"
    host_url = request.host_url.rstrip('/')
    
    # The internal Flask port (change if you use a different port)
    internal_port = 5000
    
    # Build the full proxy URL
    base_url = f"{host_url}/proxy/{internal_port}"
    static_url = f"{base_url}/static"
    
    return {
        "base_url": base_url,
        "static_url": static_url
    }


# =============================================================================
# Routes
# =============================================================================

@app.route("/")
def home():
    """Landing page route."""
    return render_template("index.html")


# =============================================================================
# Additional Routes (Examples - Uncomment and modify as needed)
# =============================================================================

# @app.route("/about")
# def about():
#     """About page route."""
#     return render_template("about.html")

# @app.route("/contact")
# def contact():
#     """Contact page route."""
#     return render_template("contact.html")


# =============================================================================
# Error Handlers (Optional)
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return render_template("index.html"), 404


# =============================================================================
# Run the Application
# =============================================================================

if __name__ == "__main__":
    # Sandbox-compatible settings
    # - host='0.0.0.0': Required for container networking
    # - port=5000: Standard Flask port (must match context processor)
    # - debug=False: Set to True for development
    app.run(host='0.0.0.0', port=5000, debug=False)