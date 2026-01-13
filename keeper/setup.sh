#!/bin/bash

# Payment Keeper Setup Script

echo "🚀 Setting up Payment Keeper Service..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and set:"
    echo "   1. KEEPER_PRIVATE_KEY (your keeper wallet private key)"
    echo "   2. PAYMENT_SCHEDULER_ADDRESS (deployed contract address)"
    echo ""
    echo "Then run: npm start"
else
    echo "✅ .env file already exists"
    echo ""
    
    # Check if configured
    if grep -q "your_private_key_here" .env; then
        echo "⚠️  WARNING: .env file needs configuration!"
        echo "   Edit .env and set KEEPER_PRIVATE_KEY"
    else
        echo "✅ Configuration looks good!"
        echo ""
        echo "Ready to start! Run: npm start"
    fi
fi

echo ""
echo "════════════════════════════════════════"
echo "Next steps:"
echo "1. Edit .env file with your settings"
echo "2. Authorize keeper: contract.addKeeper('0xYourKeeperAddress')"
echo "3. Fund keeper wallet with MNT for gas"
echo "4. Run: npm start"
echo "════════════════════════════════════════"
