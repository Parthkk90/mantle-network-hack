# CRESCA Mobile App

Production-ready React Native app for sending and receiving MNT payments on Mantle Network.

## Features

- ✅ Wallet Creation & Import
- ✅ Send MNT Payments
- ✅ Receive MNT Payments
- ✅ Transaction History
- ✅ Secure Key Storage

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

1. Create or import wallet
2. Get testnet MNT from faucet
3. Send test payment (0.01 MNT)
4. Check transaction on Mantlescan

## Support

Network: Mantle Sepolia Testnet  
Explorer: https://sepolia.mantlescan.xyz
