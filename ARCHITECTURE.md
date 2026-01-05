# CRESCA - Technical Architecture

## System Architecture Overview

CRESCA is built on Mantle Network using a multi-layered architecture that separates concerns between smart contracts, backend services, and the mobile application.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Wallet  │  │  Bundle  │  │   Swap   │  │ Schedule │   │
│  │   View   │  │   View   │  │   View   │  │   View   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Payment    │  │    Price     │  │   Scheduler  │     │
│  │   Service    │  │    Oracle    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Mantle Network (L2 Blockchain)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Bundle    │  │   Swap       │  │   Payment    │     │
│  │   Factory    │  │   Router     │  │   Scheduler  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Bundle     │  │     Vault    │                        │
│  │    Token     │  │   Manager    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### 1. Bundle Token System

#### BundleFactory.sol
- **Purpose**: Creates and manages custom token bundles
- **Key Functions**:
  - `createBundle(address[] tokens, uint256[] weights, string metadata)` - Creates new bundle
  - `getBundleInfo(address bundle)` - Returns bundle configuration
  - `listAllBundles()` - Returns all created bundles

#### BundleToken.sol (ERC-20)
- **Purpose**: Represents ownership in a token bundle
- **Key Features**:
  - ERC-20 compliant token representing bundle shares
  - Minting on deposit of underlying tokens
  - Burning on withdrawal
  - Tracks underlying token allocations
- **Key Functions**:
  - `deposit(uint256[] amounts)` - Deposit tokens and mint bundle tokens
  - `withdraw(uint256 bundleAmount)` - Burn bundle tokens and receive underlying
  - `rebalance()` - Adjusts allocations to target weights
  - `getUnderlyingAmounts(uint256 bundleAmount)` - Calculate underlying token amounts

#### VaultManager.sol
- **Purpose**: Holds and manages underlying tokens for all bundles
- **Key Functions**:
  - `depositToBundle(address bundle, address[] tokens, uint256[] amounts)`
  - `withdrawFromBundle(address bundle, uint256 shares)`
  - `rebalanceBundle(address bundle)` - Executes swaps to maintain target weights

### 2. Swap System

#### SwapRouter.sol
- **Purpose**: Aggregates liquidity from multiple DEXs on Mantle
- **Key Functions**:
  - `swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)`
  - `getBestPrice(address tokenIn, address tokenOut, uint256 amountIn)` - Query best rate
  - `addLiquiditySource(address dex)` - Register new DEX
- **Integrated DEXs**:
  - Agni Finance (Mantle's native DEX)
  - Merchant Moe
  - FusionX
  - Other Mantle-compatible DEXs

### 3. Payment Scheduler System

#### PaymentScheduler.sol
- **Purpose**: Manages scheduled and recurring payments
- **Key Functions**:
  - `createSchedule(address token, address recipient, uint256 amount, uint256 interval, uint256 startTime)`
  - `executeScheduledPayment(uint256 scheduleId)` - Execute payment (called by keeper)
  - `cancelSchedule(uint256 scheduleId)` - Cancel scheduled payment
  - `pauseSchedule(uint256 scheduleId)` - Pause payments
  - `resumeSchedule(uint256 scheduleId)` - Resume payments
- **Payment Types**:
  - One-time scheduled payments
  - Recurring payments (daily, weekly, monthly)
  - DCA (Dollar-Cost Averaging) purchases

#### AutomationKeeper.sol
- **Purpose**: Chainlink Automation compatible keeper for executing scheduled payments
- **Key Functions**:
  - `checkUpkeep()` - Check if payments need execution
  - `performUpkeep()` - Execute pending payments

### 4. Wallet Core

#### CrescaWallet.sol
- **Purpose**: User wallet contract for multi-sig and advanced features (optional)
- **Key Functions**:
  - `send(address token, address recipient, uint256 amount)`
  - `batchSend(address token, address[] recipients, uint256[] amounts)`
  - `approveToken(address token, address spender, uint256 amount)`

### 5. RWA / RealFi System

#### RWAToken.sol (ERC-20)
- **Purpose**: Tokenize real-world assets (real estate, bonds, invoices, cash-flow rights)
- **Key Features**:
  - ERC-20 compliant tokens representing fractionalized asset ownership
  - KYC-gated transfers for regulatory compliance
  - Automated yield distribution to token holders
  - Support for multiple asset types with detailed metadata
- **Key Functions**:
  - `mint(address to, uint256 amount)` - Mint tokens to verified investors
  - `verifyAsset(string valuationHash)` - Verify asset with legal documentation
  - `distributeYield(uint256 amount, string description)` - Distribute yields to holders
  - `claimYield()` - Holders claim accumulated yields
  - `isKYCVerified(address account)` - Check KYC status
  - `setTransferRestricted(bool restricted)` - Control transfer permissions

#### KYCRegistry.sol
- **Purpose**: Manage KYC/AML compliance for RWA token holders
- **Key Features**:
  - Tiered KYC levels (Basic, Intermediate, Advanced)
  - Jurisdiction-based compliance rules
  - Accredited investor verification
  - Blacklist management
- **KYC Tiers**:
  - `BASIC` - Basic identity verification
  - `INTERMEDIATE` - Enhanced due diligence
  - `ADVANCED` - Accredited investor status
- **Key Functions**:
  - `verifyKYC(address user, KYCTier tier, string jurisdiction, ...)` - Verify user
  - `updateKYCTier(address user, KYCTier newTier)` - Upgrade/downgrade tier
  - `revokeKYC(address user, string reason)` - Revoke verification
  - `setJurisdictionRules(string jurisdiction, ...)` - Set compliance rules per country
  - `isVerified(address user)` - Check if user is verified
  - `canInvestFromJurisdiction(address user, uint256 amount)` - Check investment eligibility

#### RWAVault.sol
- **Purpose**: Secure custody of RWA-backed assets with institutional-grade controls
- **Key Features**:
  - Multi-signature approval for withdrawals
  - Time-locked withdrawals (2-day timelock)
  - Asset auditing capabilities
  - Yield collection tracking
- **Key Functions**:
  - `depositAsset(address token, uint256 amount, string assetId)` - Deposit assets to custody
  - `requestWithdrawal(address token, address recipient, uint256 amount, ...)` - Request withdrawal
  - `approveWithdrawal(uint256 requestId)` - Multi-sig approval
  - `executeWithdrawal(uint256 requestId)` - Execute after timelock
  - `collectYield(address token, uint256 amount)` - Collect RWA yields
  - `auditAsset(address token)` - Verify custody balances

#### YieldDistributor.sol
- **Purpose**: Distribute RWA yields with tax compliance and jurisdiction rules
- **Key Features**:
  - Automated yield distribution to token holders
  - Jurisdiction-based tax withholding
  - Batch claiming for gas efficiency
  - Comprehensive tracking and reporting
- **Key Functions**:
  - `createDistribution(address rwaToken, address yieldToken, uint256 amount, ...)` - Create new distribution
  - `claimYield(uint256 distributionId)` - Claim individual distribution
  - `batchClaimYield(uint256[] distributionIds)` - Claim multiple distributions
  - `getClaimableAmount(uint256 distributionId, address holder)` - Check claimable yield
  - `setTaxWithholding(string jurisdiction, uint256 rate, address recipient)` - Set tax rules

#### InvoiceFactoring.sol
- **Purpose**: Tokenize invoices and provide early payment liquidity
- **Key Features**:
  - Invoice verification and factoring
  - Credit limit management for buyers
  - Liquidity pool for funding
  - Default tracking and management
- **Key Functions**:
  - `createInvoice(address buyer, uint256 amount, uint256 dueDate, ...)` - Create invoice
  - `verifyInvoice(uint256 invoiceId, uint256 discountRate)` - Verify and price invoice
  - `fundInvoice(uint256 invoiceId)` - Fund verified invoice (seller gets paid)
  - `payInvoice(uint256 invoiceId)` - Buyer pays invoice
  - `addLiquidity(uint256 amount)` - Add liquidity to factoring pool
  - `setBuyerCreditLimit(address buyer, uint256 limit)` - Set buyer credit limits

## Backend Architecture

### 1. API Services (Node.js + Express)

#### Payment Service
```
POST /api/payments/send
POST /api/payments/batch
GET  /api/payments/history/:address
```

#### Bundle Service
```
POST /api/bundles/create
GET  /api/bundles/:bundleId
GET  /api/bundles/performance/:bundleId
POST /api/bundles/invest
POST /api/bundles/withdraw
```

#### Swap Service
```
POST /api/swaps/execute
GET  /api/swaps/quote
GET  /api/swaps/history/:address
```

#### Scheduler Service
```
POST /api/schedules/create
GET  /api/schedules/:userId
PUT  /api/schedules/:scheduleId
DELETE /api/schedules/:scheduleId
GET  /api/schedules/:scheduleId/history
```

### 2. Price Oracle Service
- Fetches real-time prices from Mantle DEXs
- Caches prices for performance
- Provides historical price data
- Calculates bundle performance metrics

### 3. Scheduler Worker
- Background job processor
- Monitors scheduled payments
- Calls keeper contract to execute payments
- Sends notifications to users

### 4. Database (PostgreSQL)
```sql
-- Users
users (id, address, created_at, settings)

-- Bundles
bundles (id, name, creator, tokens, weights, created_at)
bundle_performance (bundle_id, timestamp, price, tvl)

-- Schedules
schedules (id, user_id, type, token, recipient, amount, interval, next_execution)
schedule_history (id, schedule_id, executed_at, tx_hash, status)

-- Transactions
transactions (id, user_id, type, tx_hash, status, created_at)
```

## Frontend Architecture (React Native)

### Navigation Structure
```
App
├── Auth Stack
│   ├── Welcome Screen
│   ├── Create Wallet Screen
│   └── Import Wallet Screen
│
└── Main Stack
    ├── Wallet Tab
    │   ├── Wallet Overview
    │   ├── Token Details
    │   └── Transaction History
    │
    ├── Bundles Tab
    │   ├── My Bundles
    │   ├── Create Bundle
    │   ├── Bundle Details
    │   └── Bundle Performance
    │
    ├── Swap Tab
    │   ├── Swap Interface
    │   ├── Token Selector
    │   └── Swap Confirmation
    │
    └── Schedule Tab
        ├── My Schedules
        ├── Create Schedule
        ├── Schedule Details
        └── Payment History
```

### Key Components

#### Wallet Provider
```typescript
interface WalletContext {
  address: string;
  balance: BigNumber;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (tx: Transaction) => Promise<string>;
}
```

#### Bundle Manager
```typescript
interface BundleManager {
  createBundle: (tokens: Token[], weights: number[], name: string) => Promise<string>;
  investInBundle: (bundleId: string, amount: BigNumber) => Promise<string>;
  withdrawFromBundle: (bundleId: string, shares: BigNumber) => Promise<string>;
  getBundlePerformance: (bundleId: string) => Promise<Performance>;
}
```

#### Swap Manager
```typescript
interface SwapManager {
  getQuote: (tokenIn: Token, tokenOut: Token, amountIn: BigNumber) => Promise<Quote>;
  executeSwap: (quote: Quote, slippage: number) => Promise<string>;
}
```

#### Schedule Manager
```typescript
interface ScheduleManager {
  createSchedule: (schedule: Schedule) => Promise<string>;
  getSchedules: () => Promise<Schedule[]>;
  cancelSchedule: (scheduleId: string) => Promise<void>;
  pauseSchedule: (scheduleId: string) => Promise<void>;
}
```

## Integration with Mantle Network

### 1. Using Mantle SDK
```typescript
import { MantleSDK } from '@mantleio/sdk';

const mantleSDK = new MantleSDK({
  l2Provider: mantleProvider,
  l1Provider: ethereumProvider,
  l2ChainId: 5000 // Mantle mainnet
});

// Deposit from L1 to L2
await mantleSDK.depositERC20({
  l1Token: tokenAddress,
  l2Token: l2TokenAddress,
  amount: amount
});
```

### 2. Using Viem with Mantle
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

### 3. Transaction Lifecycle
1. User initiates action in app
2. Frontend constructs transaction
3. User signs transaction with wallet
4. Transaction sent to Mantle Network
5. Sequencer processes transaction
6. State updated on Mantle L2
7. Eventually finalized on Ethereum L1

## Security Considerations

### Smart Contract Security
- ✅ OpenZeppelin contract libraries
- ✅ Reentrancy guards on all external calls
- ✅ Access control (Ownable, Role-based)
- ✅ Pause mechanism for emergencies
- ✅ Slippage protection on swaps
- ✅ Time-lock for admin functions
- ✅ Comprehensive unit and integration tests
- ✅ External audit before mainnet launch

### Backend Security
- ✅ API rate limiting
- ✅ JWT authentication
- ✅ Encryption for sensitive data
- ✅ Input validation and sanitization
- ✅ HTTPS only
- ✅ Database connection pooling

### Frontend Security
- ✅ Secure key storage (hardware/software wallets)
- ✅ Transaction signing confirmation
- ✅ Biometric authentication support
- ✅ No private keys in app memory
- ✅ SSL pinning
- ✅ Jailbreak/root detection

## Scalability Strategy

### Phase 1 (MVP)
- Support 5-10 popular tokens
- Basic bundle creation
- Simple swap functionality
- Manual payment scheduling

### Phase 2 (Growth)
- Support 50+ tokens
- Advanced bundle strategies
- DEX aggregation
- Automated rebalancing
- Batch operations

### Phase 3 (Scale)
- Support all ERC-20 tokens on Mantle
- Cross-chain bundles (using bridges)
- Advanced DeFi strategies
- Social features (copy bundles)
- Institutional features

## Performance Optimization

### Smart Contracts
- Batch operations to reduce gas costs
- Efficient data structures (mappings over arrays)
- Minimize storage writes
- Use events for indexing

### Backend
- Redis caching for prices and bundle data
- Database indexing on frequently queried fields
- WebSocket for real-time updates
- CDN for static assets

### Frontend
- Lazy loading of components
- Optimized images
- Bundle size optimization
- Local caching of wallet data

## Monitoring & Analytics

### Metrics to Track
- Total Value Locked (TVL)
- Number of bundles created
- Number of active users
- Swap volume
- Scheduled payments executed
- Transaction success rate
- Gas costs
- API response times

### Tools
- Tenderly for contract monitoring
- Datadog for backend monitoring
- Sentry for error tracking
- Mixpanel for user analytics
- Dune Analytics for on-chain data

## Deployment Strategy

### Smart Contracts
1. Deploy to Mantle Testnet (Sepolia)
2. Comprehensive testing
3. External audit
4. Deploy to Mantle Mainnet
5. Verify contracts on Mantle Explorer

### Backend
1. Docker containerization
2. Deploy to AWS/GCP
3. Set up CI/CD pipeline
4. Monitoring and alerting
5. Backup and disaster recovery

### Frontend
1. Build iOS and Android apps
2. TestFlight/Play Store beta testing
3. App Store submission
4. Phased rollout

## Future Enhancements

- 🔮 AI-powered bundle recommendations
- 🔮 Social trading features
- 🔮 NFT support in bundles
- 🔮 Yield farming integration
- 🔮 Cross-chain support
- 🔮 Lending/borrowing against bundles
- 🔮 DAO governance for platform
- 🔮 Mobile wallet connect for dApps
