# CRESCA Quick Start Guide

## What is CRESCA?

CRESCA is a mobile DeFi wallet built on Mantle Network that makes crypto investing simple through:

- **Bundle Tokens**: Invest in multiple cryptocurrencies at once
- **Smart Swaps**: Get the best prices across all DEXs
- **Scheduled Payments**: Automate your crypto payments
- **Easy Transfers**: Send and receive crypto with ease

## For Users

### 1. Get Testnet MNT
Visit: https://faucet.sepolia.mantle.xyz/

### 2. Download Wallet (Coming Soon)
- iOS: App Store
- Android: Google Play

### 3. Create Wallet
- Open app
- Create new wallet
- Save seed phrase (IMPORTANT!)

### 4. Send/Receive MNT
- Tap "Send" to send MNT
- Tap "Receive" to get your address

## For Developers

### Quick Deploy
```bash
git clone https://github.com/Parthkk90/mantle-network-hack.git
cd mantle-network-hack/contracts
npm install
npx hardhat run scripts/deployAll.ts --network mantleSepolia
```

### Project Structure
```
mantle-hack/
├── contracts/          # Smart contracts (deployed ✅)
├── mobile/            # React Native app (WIP 🚧)
├── docs/             # Documentation
└── scripts/          # Deployment scripts
```

### Smart Contract Overview

#### BundleFactory
Creates and manages custom token bundles.
```solidity
function createBundle(
    address[] tokens,
    uint256[] weights,
    string name,
    string symbol
) external returns (address bundleToken)
```

#### BundleToken
ERC-20 token representing bundle shares.
```solidity
function deposit(uint256[] amounts) external returns (uint256)
function withdraw(uint256 bundleAmount) external returns (uint256[])
```

#### SwapRouter
Aggregates liquidity for best swap prices.
```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,
    uint256 deadline
) external returns (uint256)
```

#### PaymentScheduler
Manages scheduled and recurring payments.
```solidity
function createSchedule(
    ScheduleType scheduleType,
    address token,
    address recipient,
    uint256 amount,
    uint256 interval,
    uint256 startTime,
    uint256 maxExecutions
) external returns (uint256 scheduleId)
```

### Using Mantle SDK

```typescript
import { MantleSDK } from '@mantleio/sdk';

const mantleSDK = new MantleSDK({
  l2Provider: mantleProvider,
  l1Provider: ethereumProvider,
  l2ChainId: 5000
});

// Deposit from L1 to L2
await mantleSDK.depositERC20({
  l1Token: tokenAddress,
  l2Token: l2TokenAddress,
  amount: amount
});
```

### Using Viem with Mantle

```typescript
import { createPublicClient, http } from 'viem';
import { mantle } from 'viem/chains';

const client = createPublicClient({
  chain: mantle,
  transport: http('https://rpc.mantle.xyz')
});

// Read contract
const balance = await client.readContract({
  address: bundleAddress,
  abi: bundleABI,
  functionName: 'balanceOf',
  args: [userAddress]
});
```

## Resources

### Documentation
- [Architecture Overview](../ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Implementation Roadmap](../ROADMAP.md)
- [API Documentation](./API.md) (coming soon)

### Mantle Network
- [Mantle Docs](https://docs.mantle.xyz/network)
- [How to Deploy Smart Contracts](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-deploy-smart-contracts)
- [Mantle SDK Guide](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-sdk)
- [Mantle Viem Guide](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-viem)

### Community
- [GitHub Repository](https://github.com/cresca/mantle-hack)
- [Discord](https://discord.gg/cresca) (coming soon)
- [Twitter](https://twitter.com/crescawallet) (coming soon)

## Example: Create and Invest in Bundle

```typescript
import { ethers } from 'ethers';

// Connect to Mantle Network
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const wallet = new ethers.Wallet(privateKey, provider);

// Contract instances
const bundleFactory = new ethers.Contract(
  bundleFactoryAddress,
  bundleFactoryABI,
  wallet
);

// Create bundle with 50% Token A, 30% Token B, 20% Token C
const tokens = [tokenA, tokenB, tokenC];
const weights = [5000, 3000, 2000]; // Basis points (100.00% = 10000)

const tx = await bundleFactory.createBundle(
  tokens,
  weights,
  "My Balanced Bundle",
  "MBB"
);
await tx.wait();

// Get bundle address
const bundleAddress = await bundleFactory.getUserBundles(wallet.address);
const myBundle = bundleAddress[bundleAddress.length - 1];

console.log("Bundle created:", myBundle);

// Invest in bundle
const bundleToken = new ethers.Contract(
  myBundle,
  bundleTokenABI,
  wallet
);

// Approve tokens
await tokenA.approve(vaultManager, amount1);
await tokenB.approve(vaultManager, amount2);
await tokenC.approve(vaultManager, amount3);

// Deposit to bundle
const depositTx = await bundleToken.deposit([amount1, amount2, amount3]);
await depositTx.wait();

console.log("Successfully invested in bundle!");
```

## Example: Schedule Recurring Payment

```typescript
// Create monthly payment schedule
const paymentScheduler = new ethers.Contract(
  paymentSchedulerAddress,
  paymentSchedulerABI,
  wallet
);

const scheduleId = await paymentScheduler.createSchedule(
  1, // RECURRING
  tokenAddress,
  recipientAddress,
  ethers.parseUnits("100", 18), // 100 tokens
  30 * 24 * 60 * 60, // 30 days
  Math.floor(Date.now() / 1000), // Start now
  0 // No max executions (unlimited)
);

console.log("Schedule created:", scheduleId);
```

## FAQ

### How do bundle tokens work?
Bundle tokens are ERC-20 tokens that represent your share of a basket of cryptocurrencies. When you invest $1000 in a bundle, you receive bundle tokens proportional to your investment. The bundle automatically rebalances to maintain target allocations.

### What fees does CRESCA charge?
- Bundle creation: Free
- Bundle deposits: Free (just gas)
- Bundle withdrawals: Free (just gas)
- Swaps: 0.3% fee
- Scheduled payments: Gas fees only

### Is CRESCA audited?
Smart contracts will undergo professional security audit before mainnet launch. See [ROADMAP.md](../ROADMAP.md) for audit timeline.

### Which tokens are supported?
Initially supporting major tokens on Mantle Network. More tokens will be added based on community demand.

### Can I cancel a scheduled payment?
Yes! You can pause, resume, or cancel scheduled payments at any time.

## Getting Help

- **Bug Reports**: [GitHub Issues](https://github.com/cresca/mantle-hack/issues)
- **Questions**: [GitHub Discussions](https://github.com/cresca/mantle-hack/discussions)
- **Feature Requests**: [GitHub Issues](https://github.com/cresca/mantle-hack/issues)
- **Security Issues**: security@cresca.app (to be set up)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

Built with ❤️ on Mantle Network
