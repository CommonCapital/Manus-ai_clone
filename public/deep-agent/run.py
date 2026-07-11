"""Entry point to launch the Flask algorithms app on localhost:5001.

Running this script inside the sandbox will start the development server
listening on all interfaces (0.0.0.0) so the external URL provided by the
sandbox can reach it.
"""

from flask_app.app import create_app

app = create_app()

if __name__ == "__main__":
    # Use host='0.0.0.0' so the sandbox can expose the port externally
    app.run(host='0.0.0.0', port=5001, debug=True)
