# CRESCA - Simple Mantle Wallet

> Send and receive MNT on Mantle testnet

## 🚀 What it does

**Core Features:**
- Create/import wallet
- Show MNT balance
- Send MNT
- Receive MNT
- Transaction history

**Bonus Features:**
- Bundle token investing (create crypto baskets)
- Swap tokens
- Scheduled payments
- RWA tokenization (real estate, bonds, invoices)

## 🏗️ Built on Mantle Network

**Why Mantle?**
- Low fees (~$0.01)
- Fast transactions
- EVM compatible

## 🛠️ Tech Stack

**Mobile App:**
- React Native
- ethers.js
- Mantle testnet RPC

**Smart Contracts:**
- Solidity 0.8.23
- Deployed on Mantle Sepolia

## 🚀 Quick Start

### Get Testnet MNT
```bash
# Visit faucet
https://faucet.sepolia.mantle.xyz/
```

### Run Wallet (Coming Soon)
```bash
cd mobile
npm install
npm run ios # or android
```

### Deploy Contracts
```bash
cd contracts
npm install
npx hardhat run scripts/deployAll.ts --network mantleSepolia
```

## 📦 Deployed Contracts

**Mantle Sepolia Testnet:**

See [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) for all contract addresses.

## 📱 Mobile App Integration

See [React Native Integration Guide](docs/REACT_NATIVE_INTEGRATION.md) for complete documentation on:
- Send/receive MNT
- Contract integration
- Code examples
- Security best practices

## 📄 License

MIT
