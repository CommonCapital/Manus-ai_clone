"""Flask application factory for the algorithm demo.

The factory pattern keeps the project modular and makes testing easier.
"""

from flask import Flask

def create_app():
    app = Flask(__name__)
    # Register blueprints / routes
    from .routes import bp as alg_bp
    app.register_blueprint(alg_bp)
    return app
