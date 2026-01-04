# CRESCA Smart Contracts

This directory contains all smart contracts for the CRESCA DeFi wallet platform.

## Contract Overview

### Core Contracts

1. **BundleFactory.sol** - Factory contract for creating token bundles
2. **BundleToken.sol** - ERC-20 token representing bundle shares
3. **VaultManager.sol** - Manages underlying assets for all bundles
4. **SwapRouter.sol** - DEX aggregator for best swap prices
5. **PaymentScheduler.sol** - Handles scheduled and recurring payments
6. **AutomationKeeper.sol** - Chainlink-compatible keeper for automation

### Interface Contracts

- **IBundleFactory.sol** - Bundle factory interface
- **IBundleToken.sol** - Bundle token interface
- **ISwapRouter.sol** - Swap router interface
- **IPaymentScheduler.sol** - Payment scheduler interface

### Library Contracts

- **BundleMath.sol** - Mathematical operations for bundles
- **SwapLibrary.sol** - Helper functions for swaps

## Contract Interactions

```
User Wallet
    │
    ├──> BundleFactory.createBundle()
    │        │
    │        └──> Deploy new BundleToken
    │        └──> Register with VaultManager
    │
    ├──> BundleToken.deposit()
    │        │
    │        └──> VaultManager.depositToBundle()
    │
    ├──> SwapRouter.swap()
    │        │
    │        └──> Query multiple DEXs
    │        └──> Execute best trade
    │
    └──> PaymentScheduler.createSchedule()
             │
             └──> AutomationKeeper.checkUpkeep()
             └──> AutomationKeeper.performUpkeep()
```

## Development Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Mantle Testnet
npx hardhat run scripts/deploy.ts --network mantle-testnet

# Verify contracts
npx hardhat verify --network mantle-testnet DEPLOYED_CONTRACT_ADDRESS
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test file
npx hardhat test test/BundleFactory.test.ts
```

## Deployment

See [deployment guide](../docs/DEPLOYMENT.md) for detailed instructions.

## Security

- All contracts use OpenZeppelin libraries
- Comprehensive test coverage (target: >95%)
- External audit required before mainnet deployment
- Bug bounty program post-launch

## Gas Optimization

- Batch operations where possible
- Efficient storage patterns
- Minimal external calls
- Event emission for off-chain indexing
