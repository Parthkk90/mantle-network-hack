# CRESCA - Deployment Guide

## Prerequisites

### 1. Install Dependencies
- Node.js 20+ and npm
- Git
- Hardhat

### 2. Get Mantle Testnet Tokens
1. Visit [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)
2. Enter your wallet address
3. Receive testnet MNT tokens

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add:
- `PRIVATE_KEY`: Your deployment wallet private key
- `MANTLESCAN_API_KEY`: Get from Mantlescan (for verification)

## Deployment Steps

### Step 0: Check Current Deployment Status
```bash
cd contracts
npx hardhat run scripts/checkBalance.ts --network mantleSepolia
```

**Current Status (as of January 13, 2026):**
- ✅ Bundle System v2: VaultManager, BundleFactory (with investment support)
- ✅ WMNT Token: 0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8
- ✅ PaymentScheduler: 0xfAc3A13b1571A227CF36878fc46E07B56021cd7B
- ✅ Keeper Service: Running and operational
- ✅ RWA Contracts: KYCRegistry, RWAVault, RWAToken, YieldDistributor

### Step 1: Compile Contracts
```bash
cd contracts
npm install
npx hardhat compile
```

### Step 2: Run Tests
```bash
npx hardhat test
npm run test:coverage
```

Ensure all tests pass and coverage is >95%.

### Step 3: Deploy to Mantle Testnet
```bash
# For remaining RWA contracts
npx hardhat run scripts/deployRemainingRWA.ts --network mantleSepolia

# Or deploy all from scratch
npx hardhat run scripts/deployAll.ts --network mantleSepolia
```

Save the deployed contract addresses!

### Step 4: Verify Contracts
```bash
npx hardhat verify --network mantle-testnet <CONTRACT_ADDRESS>
```

Repeat for each contract:
- SwapRouter
- VaultManager
- BundleFactory
- PaymentScheduler

### Step 5: Configure Contracts

#### Add DEXs to SwapRouter
```typescript
// Example: Add Agni Finance
await swapRouter.addDEX("0x...AgniRouterAddress");
```

#### Set Up Keeper
```typescript
// Add keeper address to PaymentScheduler
await paymentScheduler.addKeeper("0x...KeeperAddress");
```

## Mainnet Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimizations done
- [ ] Emergency procedures documented
- [ ] Monitoring set up
- [ ] Sufficient MNT for deployment

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.ts --network mantle-mainnet
```

### Post-Deployment
1. Verify all contracts on Mantlescan
2. Transfer ownership to multi-sig
3. Set up monitoring alerts
4. Test with small amounts first
5. Announce deployment

## Troubleshooting

### Gas Estimation Failed
- Ensure wallet has sufficient MNT
- Check network connectivity
- Verify contract compiles without errors

### Verification Failed
- Double-check constructor arguments
- Ensure MANTLESCAN_API_KEY is valid
- Wait a few minutes and retry

### Transaction Reverted
- Review revert messages
- Check transaction on Mantlescan
- Verify contract state

## Mantle Network Information

### Testnet (Sepolia)
- **Chain ID**: 5003
- **RPC**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://sepolia.mantlescan.xyz
- **Faucet**: https://faucet.sepolia.mantle.xyz

### Mainnet
- **Chain ID**: 5000
- **RPC**: https://rpc.mantle.xyz
- **Explorer**: https://mantlescan.xyz

## Useful Commands

```bash
# Clean artifacts
npx hardhat clean

# Local Hardhat node
npx hardhat node

# Deploy to local node
npx hardhat run scripts/deploy.ts --network localhost

# Gas reporter
REPORT_GAS=true npx hardhat test

# Coverage report
npx hardhat coverage
```

## Next Steps After Deployment

1. **Test Bundle Creation & Investment**
   - Create a test bundle: `npx hardhat run scripts/create-test-bundle.ts --network mantleSepolia`
   - Test investment: `npx hardhat run scripts/test-investment.ts --network mantleSepolia`
   - Verify bundle on explorer

2. **Test Scheduled Payments**
   - Authorize keeper: `npx hardhat run scripts/authorize-keeper.ts --network mantleSepolia`
   - Start keeper service: `cd keeper && npm start`
   - Create test schedule from mobile app
   - Watch keeper execute automatically

3. **Update Frontend**
   - BundleFactory: `0xd218F93Fd6adE12E7C89F20172aC976ec79bcbA9`
   - VaultManager: `0x4A4A9Ae6f059334794A9200fB19E3780d17b587C`
   - WMNT: `0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8`
   - PaymentScheduler: `0xfAc3A13b1571A227CF36878fc46E07B56021cd7B`

## Support

For deployment issues:
- Check [Mantle Docs](https://docs.mantle.xyz)
- Ask in [Mantle Discord](https://discord.gg/0xmantle)
- Open GitHub issue
