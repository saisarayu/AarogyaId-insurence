#!/bin/bash
set -e

echo "Python version:"
python --version

echo "Installing dependencies with pre-built wheels only..."
pip install --prefer-binary --no-build-isolation -r requirements.txt

echo "Build complete!"
