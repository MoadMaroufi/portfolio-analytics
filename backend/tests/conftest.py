import sys
import os

# Add the backend directory to the path so `from main import app` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
