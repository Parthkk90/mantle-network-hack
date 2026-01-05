# CRESCA RWA System Architecture Diagrams

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                           │
│                                                                │
│  Mobile App (React Native) / Web App (React)                  │
│                                                                │
│  [Wallet] [Bundles] [RWA Assets] [Swap] [Schedule]           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                           │
│                                                                │
│  API Gateway → [Auth] [KYC] [Asset Mgmt] [Yield] [Swap]     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│               RWA / REALFI SMART CONTRACTS                    │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  RWAToken   │  │     KYC     │  │  RWAVault   │         │
│  │   (ERC20)   │  │  Registry   │  │  (Custody)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │    Yield    │  │   Invoice   │                           │
│  │ Distributor │  │  Factoring  │                           │
│  └─────────────┘  └─────────────┘                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              EXISTING DEFI CONTRACTS                          │
│                                                                │
│  [BundleFactory] [SwapRouter] [PaymentScheduler] [Vault]     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                    MANTLE NETWORK (L2)                        │
│                                                                │
│  Low Fees | High Throughput | Ethereum Security               │
└──────────────────────────────────────────────────────────────┘
```

## RWA Tokenization Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ASSET ONBOARDING                                           │
└──────────────────────────────────────────────────────────────┘
                         │
                         ↓
    Asset Owner submits documentation
         │
         ├─→ Property deed / Bond prospectus / Invoice
         ├─→ Valuation report
         ├─→ Legal agreements
         └─→ Insurance documents
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. VERIFICATION & KYC                                         │
└──────────────────────────────────────────────────────────────┘
                         │
                         ↓
    Compliance Team verifies asset
         │
         ├─→ Third-party appraisal
         ├─→ Title search / Due diligence
         ├─→ Legal review
         └─→ Upload to IPFS → Store hash
                         │
                         ↓
    Deploy RWAToken contract
         │
         └─→ AssetType (RE/Bond/Invoice/CashFlow)
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. TOKEN ISSUANCE                                             │
└──────────────────────────────────────────────────────────────┘
                         │
                         ↓
    Investors complete KYC
         │
         ├─→ Identity verification (Basic)
         ├─→ Enhanced due diligence (Intermediate)
         └─→ Accredited investor check (Advanced)
                         │
                         ↓
    Mint RWA tokens to investors
         │
         └─→ Only KYC-verified addresses
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. YIELD DISTRIBUTION                                         │
└──────────────────────────────────────────────────────────────┘
                         │
                         ↓
    Asset generates income
         │
         ├─→ Real Estate: Monthly rent
         ├─→ Bonds: Quarterly coupons
         ├─→ Invoices: Payment at maturity
         └─→ Cash-Flow: Revenue share
                         │
                         ↓
    Deposit to YieldDistributor
         │
         └─→ Calculate per-token amount
                         │
                         ↓
    Token holders claim yield
         │
         ├─→ Tax withholding applied
         └─→ Net amount transferred
```

## KYC Verification Flow

```
┌─────────────┐
│ New User    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Submit Identity Documents               │
│ • Passport / Driver's License           │
│ • Selfie / Liveness check               │
│ • Proof of address                      │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ KYC Provider Verification               │
│ (Onfido / Jumio / Sumsub)              │
│ • Document verification                 │
│ • Face matching                         │
│ • Sanctions screening                   │
│ • PEP checks                            │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Compliance Review                       │
│ • Manual review (if needed)             │
│ • Risk assessment                       │
│ • Jurisdiction check                    │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ KYCRegistry.verifyKYC()                 │
│ • Set tier (Basic/Int/Advanced)         │
│ • Record jurisdiction                   │
│ • Set expiration (365 days)             │
│ • Store document hash                   │
└──────┬──────────────────────────────────┘
       │
       ↓
   ┌───┴───┐
   │       │
   ↓       ↓
APPROVED  REJECTED
   │
   ↓
┌─────────────────────────────────────────┐
│ User Can Now:                           │
│ • Buy RWA tokens                        │
│ • Receive transfers                     │
│ • Claim yields                          │
│ • Trade on secondary market             │
└─────────────────────────────────────────┘
```

## Custody & Withdrawal Flow

```
┌─────────────────────────────────────────┐
│ Asset deposited to RWAVault             │
│ Amount: $1,000,000 USDC                 │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Vault State:                            │
│ • totalAmount: $1M                      │
│ • lockedAmount: $0                      │
│ • availableAmount: $1M                  │
└─────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Asset Manager requests withdrawal       │
│ requestWithdrawal($100k)                │
└──────┬──────────────────────────────────┘
       │
       ↓ TIMELOCK STARTS (48 hours)
       │
┌─────────────────────────────────────────┐
│ Vault State:                            │
│ • totalAmount: $1M                      │
│ • lockedAmount: $100k (locked)          │
│ • availableAmount: $900k                │
└─────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Multi-Sig Approvals Required (2 of N)  │
│ • Custodian 1: approveWithdrawal() ✓    │
│ • Custodian 2: approveWithdrawal() ✓    │
└──────┬──────────────────────────────────┘
       │
       ↓ Wait 48 hours
       │
┌─────────────────────────────────────────┐
│ executeWithdrawal()                     │
│ • Transfer $100k to recipient           │
│ • Update vault state                    │
│ • Emit events                           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Final Vault State:                      │
│ • totalAmount: $900k                    │
│ • lockedAmount: $0                      │
│ • availableAmount: $900k                │
└─────────────────────────────────────────┘
```

## Invoice Factoring Flow

```
SELLER                    PLATFORM                    BUYER
  │                          │                          │
  │ Create Invoice           │                          │
  │ ($100k, 60 days)        │                          │
  ├────────────────────────→│                          │
  │                          │                          │
  │                          │ Verify Invoice           │
  │                          │ • Check buyer credit     │
  │                          │ • Validate documents     │
  │                          │ • Set 3% discount        │
  │                          │                          │
  │                          │ Request Buyer Approval   │
  │                          ├────────────────────────→│
  │                          │                          │
  │                          │←────────────────────────┤
  │                          │ Buyer Approves           │
  │                          │                          │
  │←────────────────────────┤                          │
  │ Receive $97k (97%)      │ Fund Invoice             │
  │ ✓ Immediate Liquidity    │ • Lock $97k             │
  │                          │ • Wait for payment       │
  │                          │                          │
  │                          │                          │
  │                     [60 days pass]                  │
  │                          │                          │
  │                          │←────────────────────────┤
  │                          │ Buyer Pays $100k         │
  │                          │                          │
  │                          │ Platform Profit: $3k     │
  │                          │ (3% for 60 days)         │
  │                          │ = 18% annualized         │
  │                          │                          │
```

## Yield Distribution Flow

```
┌─────────────────────────────────────────┐
│ Property generates $40k monthly rent    │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Property Manager deposits to            │
│ YieldDistributor contract               │
│ createDistribution($40k)                │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Calculate per-token amount:             │
│ Total Supply: 5,000,000 tokens          │
│ Per Token: $40k / 5M = $0.008           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Token Holders Claim Yield               │
└─────────────────────────────────────────┘
       │
       ├─→ Holder A (100k tokens)
       │   ├─ Gross: $800
       │   ├─ Tax (US, 30%): $240
       │   └─ Net: $560 ✓
       │
       ├─→ Holder B (250k tokens, SG)
       │   ├─ Gross: $2,000
       │   ├─ Tax (SG, 0%): $0
       │   └─ Net: $2,000 ✓
       │
       └─→ Holder C (50k tokens)
           ├─ Gross: $400
           ├─ Tax (UK, 20%): $80
           └─ Net: $320 ✓
```

## Token Transfer with KYC Check

```
Transfer Request:
  From: Alice (0x123...)
  To: Bob (0x456...)
  Amount: 1000 RWA tokens
       │
       ↓
┌─────────────────────────────────────────┐
│ RWAToken._update() hook                 │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Check KYC Status                        │
│ kycRegistry.isVerified(Bob)             │
└──────┬──────────────────────────────────┘
       │
   ┌───┴───┐
   │       │
   ↓       ↓
VERIFIED  NOT VERIFIED
   │           │
   │           ↓
   │      REVERT ❌
   │      "Recipient not KYC verified"
   │
   ↓
┌─────────────────────────────────────────┐
│ Check Transfer Restrictions             │
│ if (transfersRestricted)                │
└──────┬──────────────────────────────────┘
       │
   ┌───┴───┐
   │       │
   ↓       ↓
BOTH       NOT BOTH
WHITELISTED WHITELISTED
   │           │
   │           ↓
   │      REVERT ❌
   │      "Transfer restricted"
   │
   ↓
┌─────────────────────────────────────────┐
│ Execute Transfer ✓                      │
│ • Update balances                       │
│ • Emit Transfer event                   │
│ • Update holder records                 │
└─────────────────────────────────────────┘
```

## System Integration Map

```
┌─────────────────────────────────────────────────┐
│                  CRESCA ECOSYSTEM                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Traditional Crypto Features:                   │
│  ┌──────────────────────────────────────────┐  │
│  │ • Bundle Tokens (BTC+ETH+SOL)            │  │
│  │ • Swap Router (Multi-DEX aggregation)    │  │
│  │ • Payment Scheduler (DCA, Bills)         │  │
│  │ • Vault Manager (Asset custody)          │  │
│  └──────────────────────────────────────────┘  │
│                       +                          │
│  RWA / RealFi Features:                         │
│  ┌──────────────────────────────────────────┐  │
│  │ • Real Estate Tokens (Rental income)     │  │
│  │ • Bond Tokens (Coupon payments)          │  │
│  │ • Invoice Factoring (B2B financing)      │  │
│  │ • KYC Registry (Compliance)              │  │
│  │ • RWA Vault (Institutional custody)      │  │
│  │ • Yield Distributor (Tax-compliant)      │  │
│  └──────────────────────────────────────────┘  │
│                       =                          │
│  Combined Innovation:                            │
│  ┌──────────────────────────────────────────┐  │
│  │ Create bundles with BOTH:                │  │
│  │ • 40% Crypto (BTC, ETH)                  │  │
│  │ • 60% RWA (Real Estate, Bonds)           │  │
│  │                                           │  │
│  │ Benefits:                                 │  │
│  │ ✓ Diversification                        │  │
│  │ ✓ Yield + Growth                         │  │
│  │ ✓ Single interface                       │  │
│  │ ✓ Low fees (Mantle)                      │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

These diagrams illustrate how all components work together to create a comprehensive RWA tokenization platform on Mantle Network!
