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
npx hardhat run scripts/deploy.ts --network mantle-testnet
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

1. **Test Bundle Creation**
   - Create a test bundle with mock tokens
   - Verify bundle tokens are minted
   - Test deposit and withdrawal

2. **Test Swaps**
   - Register test DEXs
   - Execute test swaps
   - Verify best price routing

3. **Test Scheduled Payments**
   - Create a test schedule
   - Execute payment manually (as keeper)
   - Verify tokens transferred

4. **Update Frontend**
   - Add contract addresses to frontend config
   - Test all user flows
   - Deploy frontend

## Support

For deployment issues:
- Check [Mantle Docs](https://docs.mantle.xyz)
- Ask in [Mantle Discord](https://discord.gg/0xmantle)
- Open GitHub issue
