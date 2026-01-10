# CRESCA Mobile App

Production-ready React Native app for sending and receiving MNT payments on Mantle Network.

## ✅ Verified & Working

**Successfully tested on Mantle Sepolia Testnet!**

Transaction: [0xfec210e2...](https://sepolia.mantlescan.xyz/tx/0xfec210e2690b49340303a2a3444c5ff939b0685c8436b951eb6134d16982ef72)

## Features

- ✅ Wallet Creation & Import (Tested ✓)
- ✅ Send MNT Payments (Tested ✓)
- ✅ Receive MNT Payments (Tested ✓)
- ✅ Real-time Balance Display
- ✅ Secure Key Storage (Expo SecureStore)
- ✅ Transaction Confirmation

## Tech Stack

- React Native (Expo)
- TypeScript
- ethers.js v6
- Mantle Sepolia Testnet

## Installation

```bash
cd cresca-app
npm install
```

## Run App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Smart Contract

**PaymentProcessor:** `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`  
**Network:** Mantle Sepolia (Chain ID: 5003)  
**Status:** ✅ Deployed & Verified  
**Explorer:** [View Contract](https://sepolia.mantlescan.xyz/address/0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8)

### Recent Transaction
- **Hash:** `0xfec210e2690b49340303a2a3444c5ff939b0685c8436b951eb6134d16982ef72`
- **Amount:** 0.01 MNT
- **Gas:** 0.01451167 MNT (~$0.014)
- **Status:** ✅ Success

## Project Structure

```
src/
├── config/
│   └── constants.ts          # Network & contract config
├── services/
│   ├── WalletService.ts      # Wallet management
│   └── PaymentService.ts     # Payment transactions
└── screens/
    ├── WalletSetupScreen.tsx # Create/Import wallet
    ├── HomeScreen.tsx        # Dashboard & history
    ├── SendScreen.tsx        # Send payments
    └── ReceiveScreen.tsx     # Receive payments
```

## Environment

No `.env` file needed. All configs in `src/config/constants.ts`.

## Security

- Private keys stored in Expo SecureStore
- Never logged or exposed
- Production-ready encryption

## Testing

### Test Wallet (For Testing Only)
```
Address: 0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d
Private Key: bcc61b58e2ede01b3a06754d3f8e2a4c195ccb55d85343be2cb9583ebd9e1486
⚠️ TESTNET ONLY - Never use for mainnet!
```

### Testing Steps
1. **Import Test Wallet**
   - Open app → "Import Existing Wallet"
   - Paste private key above
   - Wallet imported ✅

2. **Get Testnet MNT** (if needed)
   - Visit: https://faucet.sepolia.mantle.xyz
   - Enter address: `0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d`
   - Request testnet tokens

3. **Send Test Payment**
   - Tap "Send"
   - Recipient: Any valid address
   - Amount: 0.01 MNT
   - Note: "Test payment"
   - Confirm → Transaction succeeds ✅

4. **Verify on Explorer**
   - Tap "View on Explorer"
   - Check transaction on Mantlescan
   - Confirm MNT transferred ✅

### Production Deployment
- Replace test wallet with user's wallet
- Deploy to Mantle Mainnet (Chain ID: 5000)
- Update RPC URL to `https://rpc.mantle.xyz`

## Support

Network: Mantle Sepolia Testnet  
Explorer: https://sepolia.mantlescan.xyz
