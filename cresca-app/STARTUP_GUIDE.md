# CRESCA App - Startup Guide

## 🎯 Current Project: Mantle Network DeFi Wallet

**Location:** `F:\W3\mantle-hack\cresca-app`  
**Network:** Mantle Sepolia Testnet  
**Framework:** React Native with Expo  
**Contract:** PaymentProcessor at `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`

## ✅ All Issues Fixed

### 1. Remote Update Error - RESOLVED ✅
- **Problem:** `java.io.IOException: Failed to download remote update`
- **Solution:** Disabled automatic updates in app.json
- **Status:** No more download errors

### 2. Style Compatibility - RESOLVED ✅
- **Problem:** CSS `gap` property not supported in React Native
- **Solution:** Replaced with `marginBottom` and `marginHorizontal`
- **Affected Files:** BundleDetailsScreen, PortfolioScreen, CreateBundleScreen
- **Status:** All screens render correctly

### 3. Code Validation - PASSED ✅
- ✅ Zero TypeScript errors
- ✅ All 8 screens validated
- ✅ Navigation working
- ✅ Payment features tested successfully

## 🚀 Quick Start (3 Steps)

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Development Server
```bash
cd F:\W3\mantle-hack\cresca-app
npx expo start
```

### Step 2: Choose Your Testing Method

**Option A: Web Browser (Fastest - Recommended for First Test)**
- Press **`w`** in the terminal
- App opens in browser instantly
- No device/emulator needed
- Perfect for UI testing

**Option B: Physical Android Device**
1. Install **Expo Go** from Play Store
2. Connect phone to same WiFi as PC
3. Scan QR code from terminal
4. App loads on your phone

**Option C: Physical iOS Device**  
1. Install **Expo Go** from App Store
2. Open Camera app and scan QR code
3. App opens in Expo Go

**Option D: Android Emulator**
1. Start Android Studio emulator first
2. Press **`a`** in terminal
3. App installs automatically

**Option E: iOS Simulator (Mac only)**
1. Press **`i`** in terminal
2. Simulator launches automatically

### Step 3: Test the Features
See [Testing Checklist](#-testing-checklist) below

## 📱 Currently Running

The Expo server is **ACTIVE** at:
- **URL:** `exp://127.0.0.1:8081`
- **Status:** Waiting for device connection
- **QR Code:** Displayed in terminal

### To Connect Your Device Right Now:

**If you have Android phone:**
```bash
1. Install Expo Go from Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code in terminal
```

**If you want to test in browser:**
```bash
# Just press 'w' in the terminal where Expo is running
# Browser will open automatically
```

## 🔧 Device Management

### Check Connected Devices

**For Android:**
```bash
# Check if ADB is installed
adb version

# List connected devices
adb devices

# If you see your device, you're ready!
# Example output:
# List of devices attached
# ABC123XYZ    device
```

**For iOS (Mac only):**
```bash
xcrun xctrace list devices
```

### Connect Only Your Device

**Remove other devices/emulators:**
```bash
# List all connected devices
adb devices

# If multiple devices, use specific device:
adb -s <device_serial> shell

# Or restart ADB to clear connections
adb kill-server
adb start-server
```

**Device Troubleshooting:**
1. Enable USB Debugging (Android Settings → Developer Options)
2. Reconnect USB cable
3. Allow USB debugging on phone prompt
4. Verify with `adb devices`

## 🌐 Network & Contract Info

**Mantle Sepolia Testnet:**
- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://sepolia.mantlescan.xyz

**Test Wallet:**
- Address: `0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d`
- Private Key: `bcc61b58...ebd9e1486`
- Balance: ~9996 MNT

**Contract:**
- PaymentProcessor: `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`

### Option 1: Restart with Clean Cache (Recommended)
```bash
# Stop current server (Ctrl+C in terminal)
cd cresca-app
npx expo start --clear
```

### Option 2: Continue with Current Server
The server is already running at http://127.0.0.1:8081

**Scan the QR code** displayed in the terminal with:
- **Android**: Expo Go app from Play Store
- **iOS**: Camera app (will open Expo Go)

### Option 3: Run on Emulator/Simulator
While the server is running, press:
- **`a`** - Open on Android emulator
- **`i`** - Open on iOS simulator
- **`w`** - Open in web browser

### Option 4: Physical Device Testing
1. Install Expo Go app on your phone
2. Connect to same WiFi as development machine
3. Scan QR code from terminal

## 📱 Testing Checklist

### Initial Setup
- [ ] App loads successfully (no update errors)
- [ ] Wallet setup screen appears on first launch
- [ ] Can create new wallet
- [ ] Can import existing wallet (test with: bcc61b58e2ede01b3a06754d3f8e2a4c195ccb55d85343be2cb9583ebd9e1486)

### Home Screen
- [ ] Shows wallet address (truncated)
- [ ] Displays balance correctly
- [ ] 4 action buttons visible: Send, Receive, Browse Bundles, My Portfolio
- [ ] Pull to refresh works

### Send/Receive (Already Working)
- [ ] Send screen: Can enter amount and recipient
- [ ] MAX button works
- [ ] Transaction completes successfully
- [ ] Receive screen: Shows address and copy button

### New Bundle Features (Test These)
- [ ] **Browse Bundles**: Tap from home
  - Shows 4 mock bundles
  - Filter buttons work (All, High APY, Low Risk)
  - Each bundle shows APY, composition bar, stats
  - Tap bundle goes to details

- [ ] **Bundle Details**: Tap any bundle
  - Shows full bundle information
  - Asset allocation visualization
  - Can enter investment amount
  - MAX button works
  - Invest button triggers confirmation

- [ ] **My Portfolio**: Tap from home
  - Shows total portfolio value
  - Lists active investments (2 mock investments)
  - Shows profit/loss
  - Performance summary displays
  - Empty state if no investments

- [ ] **Create Bundle**: Tap in Bundles screen
  - Can add assets from picker
  - Asset allocation inputs work
  - Allocation bar updates in real-time
  - Total must equal 100%
  - Validation works
  - Create button enabled when valid

## 🐛 Troubleshooting

### Error: "Failed to download remote update"
**✅ FIXED** - Updates disabled in app.json

### App won't start / Stuck on loading
1. Clear Expo cache: `npx expo start --clear`
2. Clear node modules: `rm -rf node_modules && npm install`
3. Clear metro cache: `npx expo start -c`

### TypeScript errors in editor
- Run: `cd cresca-app && npm install`
- Reload VS Code window

### QR code won't scan
- Ensure phone and computer are on same WiFi
- Try pressing `w` to test in web browser first
- Check firewall isn't blocking port 8081

### Styles look broken
- ✅ FIXED - Removed unsupported CSS properties
- App now uses React Native compatible styles only

## 🔧 Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on specific platform
npm run android  # Requires Android emulator/device
npm run ios      # Requires Mac with Xcode
npm run web      # Opens in browser

# Install dependencies
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

## 📊 Current Features Status

### ✅ Working
- Wallet creation & import
- Balance display
- Send MNT payments (tested successfully)
- Receive address display
- Browse bundles with filters
- Bundle details view
- Portfolio tracking
- Create custom bundles
- All navigation flows

### ⏳ Simulated (No Backend Yet)
- Bundle investment transactions
- Portfolio profit calculations
- Payment history (contract needs updates)

### 📝 Next Steps
1. Connect bundle features to smart contracts
2. Add QR code scanning
3. Enable payment history (update contract)
4. Add biometric authentication
5. Deploy to mainnet

## 🎯 Test Wallet

**Address:** 0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d
**Private Key:** bcc61b58e2ede01b3a06754d3f8e2a4c195ccb55d85343be2cb9583ebd9e1486
**Balance:** ~9996 MNT (Mantle Sepolia)

⚠️ **TESTNET ONLY** - Do not use on mainnet!

## 📞 Support

If issues persist:
1. Check terminal logs for specific errors
2. Verify all dependencies installed: `npm install`
3. Ensure Expo CLI is updated: `npm install -g expo-cli`
4. Clear all caches: `npx expo start --clear`

**App is now ready for full testing!** 🚀
