"""
Flask Landing App with Dynamic Proxy URL Support
=================================================

This Flask application includes a context processor that automatically generates
correct URLs for static assets when deployed in sandbox proxy environments.

Features:
- Dynamic proxy URL generation
- Works with any sandbox proxy port
- No hard-coded URLs

Author: Ijambo
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
# Run the Application
# =============================================================================

if __name__ == "__main__":
    # Sandbox-compatible settings
    # - host='0.0.0.0': Required for container networking
    # - port=5000: Standard Flask port (must match context processor)
    # - debug=False: Set to True for development
    app.run(host='0.0.0.0', port=5000, debug=False)