import os
import sys
from pathlib import Path

# Add project root directory to Python path for Vercel Serverless Function
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from app import app

# Export app for Vercel serverless WSGI execution
app = app
