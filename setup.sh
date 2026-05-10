#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================"
echo "  BDO PvP Helper - Development Setup    "
echo "========================================"
echo ""

# 1. Check for uv and install if missing
echo "[1/4] Checking Python tooling (uv)..."
if ! command -v uv &> /dev/null; then
    echo "  > uv is not installed. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Source the environment variables usually set by the installer
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    elif [ -f "$HOME/.local/bin/env" ]; then
        source "$HOME/.local/bin/env"
    fi
    
    # Provide a direct fallback path just in case
    export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
else
    echo "  > uv is already installed."
fi

# 2. Setup Python environment
echo ""
echo "[2/4] Setting up Python virtual environment..."
uv venv

# Activate virtual environment for subsequent uv pip commands
source .venv/bin/activate

# 3. Install Python dependencies
echo ""
echo "[3/4] Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    uv pip install -r requirements.txt
else
    echo "  > Warning: requirements.txt not found!"
fi

# 4. Setup Next.js frontend
echo ""
echo "[4/4] Setting up Next.js frontend environment..."
if [ -d "frontend-next" ]; then
    cd frontend-next
    
    if ! command -v npm &> /dev/null; then
        echo "  > Error: npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    echo "  > Installing npm dependencies..."
    npm install
    
    cd ..
else
    echo "  > Warning: frontend-next directory not found!"
fi

echo ""
echo "==========================================================="
echo "Setup complete! 🎉"
echo "==========================================================="
echo ""
echo "To run the application locally:"
echo ""
echo "1. Start the Python Backend:"
echo "   source .venv/bin/activate"
echo "   cd backend/aos"
echo "   python api.py"
echo ""
echo "2. Start the Next.js Frontend (in a new terminal):"
echo "   cd frontend-next"
echo "   npm run dev"
echo "==========================================================="
