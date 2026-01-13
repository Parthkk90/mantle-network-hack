@echo off
REM Payment Keeper Setup Script for Windows

echo.
echo 🚀 Setting up Payment Keeper Service...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo    Please install Node.js from https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    echo ✅ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env file and set:
    echo    1. KEEPER_PRIVATE_KEY ^(your keeper wallet private key^)
    echo    2. PAYMENT_SCHEDULER_ADDRESS ^(deployed contract address^)
    echo.
    echo Then run: npm start
) else (
    echo ✅ .env file already exists
    echo.
    
    findstr /C:"your_private_key_here" .env >nul
    if %ERRORLEVEL% EQU 0 (
        echo ⚠️  WARNING: .env file needs configuration!
        echo    Edit .env and set KEEPER_PRIVATE_KEY
    ) else (
        echo ✅ Configuration looks good!
        echo.
        echo Ready to start! Run: npm start
    )
)

echo.
echo ════════════════════════════════════════
echo Next steps:
echo 1. Edit .env file with your settings
echo 2. Authorize keeper: contract.addKeeper^('0xYourKeeperAddress'^)
echo 3. Fund keeper wallet with MNT for gas
echo 4. Run: npm start
echo ════════════════════════════════════════
echo.
pause
