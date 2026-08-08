import os
import sys
from pathlib import Path

# Add project root directory to Python path for Vercel Serverless Function
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from app import app

class VercelPathFixer:
    """WSGI middleware to normalize request paths for Vercel serverless functions."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        # Remove Vercel function prefix if prepended to PATH_INFO
        if path.startswith("/api/index"):
            environ["PATH_INFO"] = path[10:] or "/"
        elif path.startswith("/api") and not path.startswith("/api/status") and not path.startswith("/api/metrics"):
            environ["PATH_INFO"] = path[4:] or "/"
        return self.wsgi_app(environ, start_response)

# Wrap Flask app with path fixer
app.wsgi_app = VercelPathFixer(app.wsgi_app)
