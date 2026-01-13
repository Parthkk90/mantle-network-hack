# CRESCA - Technical Architecture

## Simple Stack

```
React Native Wallet
    ↓
ethers.js
    ↓
Mantle Testnet RPC
    ↓
Smart Contracts
```

## Core Features

### 1. Wallet (MVP)
- Create/import wallet
- Show MNT balance
- Send MNT
- Receive MNT
- Transaction history

**Tech:**
- React Native
- ethers.js
- AsyncStorage

### 2. DeFi Features (Bonus)
- Bundle tokens (crypto baskets)
- Token swaps
- Scheduled payments

### 3. RWA Features (Advanced)
- Real estate tokenization
- KYC compliance
- Yield distribution

## Smart Contracts

### PaymentProcessor.sol
```solidity
function send(address recipient, uint256 amount) external;
function getBalance(address account) external view returns (uint256);
```

### BundleFactory.sol
```solidity
function createBundle(address[] tokens, uint256[] weights) external;
```

### RWAToken.sol
```solidity
function mint(address to, uint256 amount) external;
function distributeYield(uint256 amount) external;
```

## Deployment

All contracts deployed to Mantle Sepolia (Chain ID 5003).

See [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) for addresses.

## Security

- OpenZeppelin contracts
- ReentrancyGuard
- Ownable
- Pausable

---

**Status:** Contracts deployed ✅ | Building wallet 🚧
