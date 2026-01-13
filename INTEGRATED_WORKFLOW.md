# CRESCA Complete Workflow: Crypto + RWA Integration

## 🎯 The Innovation: Unified Crypto + RWA Bundles

CRESCA's unique value proposition is **mixing traditional crypto with real-world assets in a single investable bundle**.

---

## 📊 Complete User Journey

### Scenario: Create "Balanced Growth Portfolio"

**Goal**: 40% Crypto (growth) + 60% RWA (stable income)

```
User Investment: $10,000
├── $4,000 (40%) → Crypto Assets
│   ├── $2,000 (20%) → BTC
│   └── $2,000 (20%) → ETH
│
└── $6,000 (60%) → Real-World Assets
    ├── $3,000 (30%) → Real Estate Tokens (9% yield)
    ├── $2,000 (20%) → Bond Tokens (8% yield)
    └── $1,000 (10%) → Invoice Tokens (18% yield)
```

---

## 🔄 Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: USER ONBOARDING                                      │
└──────────────────────────────────────────────────────────────┘
                         │
User creates wallet ─────┤
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: KYC VERIFICATION (for RWA access)                    │
└──────────────────────────────────────────────────────────────┘
                         │
KYCRegistry.verifyKYC() ─┤
✓ Identity verified      │
✓ Jurisdiction: US       │
✓ Tier: INTERMEDIATE     │
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: BROWSE AVAILABLE ASSETS                              │
└──────────────────────────────────────────────────────────────┘
                         │
Available Assets: ───────┤
                         │
Crypto:                  │
├─ BTC  ($50k) ───────────┤
├─ ETH  ($3k) ────────────┤
├─ SOL  ($100) ───────────┤
└─ USDC ($1) ─────────────┤
                         │
RWA Tokens:              │
├─ Miami RE Token ────────┤ (Real Estate - 9% yield)
├─ Corp Bond Token ───────┤ (Bonds - 8% yield)
└─ Invoice Pool Token ────┤ (Invoices - 18% yield)
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: CREATE MIXED BUNDLE                                  │
└──────────────────────────────────────────────────────────────┘
                         │
BundleFactory.createBundle() ─┤
                         │
Selected Tokens: ────────┤
├─ BTC (20%)            │
├─ ETH (20%)            │
├─ Miami RE Token (30%) │
├─ Corp Bond Token (20%)│
└─ Invoice Token (10%)  │
                         │
✓ Bundle Created: "Balanced Growth" ─┐
Bundle Token Address: 0xABC...        │
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: INVEST IN BUNDLE                                     │
└──────────────────────────────────────────────────────────────┘
                         │
User deposits $10,000 ───┤
                         │
VaultManager: ───────────┤
├─ Swap $4k → BTC + ETH (via SwapRouter)
├─ Buy $3k Miami RE Tokens (KYC checked ✓)
├─ Buy $2k Corp Bond Tokens (KYC checked ✓)
└─ Buy $1k Invoice Tokens (KYC checked ✓)
                         │
✓ Assets stored in VaultManager
✓ Bundle tokens minted to user
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: AUTO-REBALANCING (Weekly)                           │
└──────────────────────────────────────────────────────────────┘
                         │
BundleToken.rebalance() ─┤
                         │
Current allocation: ─────┤
├─ BTC: 25% (↑ price)   │
├─ ETH: 18% (↓ price)   │
├─ Miami RE: 28%        │
├─ Corp Bond: 20%       │
└─ Invoice: 9%          │
                         │
Rebalance actions: ──────┤
├─ Sell 5% BTC → buy ETH & Invoices
└─ Maintain RWA positions
                         │
✓ Back to target: 20/20/30/20/10
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: YIELD DISTRIBUTION (Monthly)                         │
└──────────────────────────────────────────────────────────────┘
                         │
Revenue Sources: ────────┤
                         │
Miami RE Token: ─────────┤
├─ $40k rent collected  │
├─ Distributed to all holders
└─ User gets: $400 (3% of $40k)
                         │
Corp Bond Token: ────────┤
├─ $20k coupon payment  │
└─ User gets: $133 (20% of $20k / holders)
                         │
Invoice Token: ──────────┤
├─ $5k invoice paid     │
└─ User gets: $50 (1% share)
                         │
Total Monthly Yield: $583 ──────┐
Annualized: ~7% on RWA portion  │
                         │
YieldDistributor.claimYield() ─┤
✓ USDC deposited to wallet
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 8: SCHEDULED DCA (Optional)                             │
└──────────────────────────────────────────────────────────────┘
                         │
PaymentScheduler: ───────┤
                         │
User sets: ──────────────┤
├─ Buy $500 "Balanced Growth" bundle
├─ Every 1st of month
└─ Auto-deduct from wallet
                         │
✓ Scheduled created
✓ Automatic execution by keeper
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 9: WITHDRAW / EXIT                                      │
└──────────────────────────────────────────────────────────────┘
                         │
User wants to exit: ─────┤
                         │
BundleFactory.withdrawFromBundle() ─┤
                         │
Burns bundle tokens ─────┤
                         │
Returns: ────────────────┤
├─ BTC: 0.04 BTC
├─ ETH: 0.6 ETH
├─ Miami RE Token: 30 tokens
├─ Corp Bond Token: 20 tokens
└─ Invoice Token: 10 tokens
                         │
OR ─────────────────────┤
                         │
Swap all to USDC: ───────┤
├─ Crypto via SwapRouter
├─ RWA tokens sold on secondary market
└─ Receive: $10,850 (8.5% gain)
```

---

## 🎨 Key Integration Points

### 1. **BundleFactory + KYCRegistry Integration**

When creating a bundle with RWA tokens:

```typescript
// User creates bundle with crypto + RWA
await bundleFactory.createBundle(
  [btcAddress, ethAddress, realEstateTokenAddress, bondTokenAddress],
  [2000, 2000, 3000, 3000], // weights (20%, 20%, 30%, 30%)
  "My Balanced Portfolio"
);

// Internal flow:
BundleFactory checks:
  ✓ Is user KYC verified? (for RWA tokens)
  ✓ Can user invest from their jurisdiction?
  ✓ Does user meet minimum investment?

If RWA tokens included → REQUIRES KYC ✓
If only crypto → NO KYC needed
```

### 2. **VaultManager + RWAVault Integration**

```typescript
// When user invests in mixed bundle:
VaultManager:
  ├─ Crypto tokens → stored in VaultManager contract
  └─ RWA tokens → verification via RWAVault
                  (ensures custody requirements met)

// Both vaults talk to each other for:
- Rebalancing operations
- Yield collection
- Withdrawal processing
```

### 3. **YieldDistributor + Bundle Integration**

```typescript
// Monthly yield distribution:
YieldDistributor.createDistribution():
  ├─ Miami RE Token holders get rent share
  │  └─ Bundle holders automatically included ✓
  │
  ├─ Corp Bond Token holders get coupon
  │  └─ Bundle holders automatically included ✓
  │
  └─ Invoice Token holders get payment
     └─ Bundle holders automatically included ✓

// User claims all yields at once:
await yieldDistributor.batchClaimYield([distId1, distId2, distId3]);
// Receives: $583 in USDC
```

### 4. **SwapRouter Integration**

```typescript
// Rebalancing crypto portion of bundle:
SwapRouter.swap():
  ├─ Find best price across Mantle DEXs
  ├─ Execute swap (BTC → ETH)
  └─ Update bundle allocations

// Exiting RWA portion:
SwapRouter.swap():
  ├─ Sell RWA token for USDC
  ├─ Check KYC of buyer ✓
  └─ Transfer with compliance
```

---

## 📈 Example Portfolio Performance

### After 1 Year

**Initial Investment**: $10,000

**Crypto Performance** (40%):
- BTC: $2,000 → $2,600 (+30%)
- ETH: $2,000 → $2,400 (+20%)
- **Crypto Total**: $5,000 ✨

**RWA Performance** (60%):
- Miami RE: $3,000 + $270 yield (9%) = $3,270
- Corp Bond: $2,000 + $160 yield (8%) = $2,160
- Invoice: $1,000 + $180 yield (18%) = $1,180
- **RWA Total**: $6,610 ✨

**Portfolio Total**: $11,610
**Total Return**: 16.1% 🎉

**Breakdown**:
- Capital Gains: $1,000 (10%)
- Yield Income: $610 (6.1%)

---

## 🚀 Unique Features

### 1. **One-Click Diversification**
```
Traditional: Buy BTC, buy ETH, buy RE token, buy bond...
CRESCA: Buy "Balanced Growth" bundle ✓ (1 transaction)
```

### 2. **Automatic Rebalancing**
```
Traditional: Manual rebalancing, multiple swaps
CRESCA: Auto-rebalance weekly ✓ (set & forget)
```

### 3. **Unified Yield Collection**
```
Traditional: Claim from RE token, claim from bond, claim from invoice...
CRESCA: Batch claim all yields ✓ (1 transaction)
```

### 4. **Compliance Built-In**
```
Traditional: KYC each platform separately
CRESCA: KYC once, access all RWA ✓
```

### 5. **Mobile-First**
```
Traditional: Desktop-only RWA platforms
CRESCA: Manage from phone ✓
```

---

## 🎯 User Personas

### Persona 1: "Crypto Native" → Diversifies into RWA
```
Starting: 100% Crypto (volatile)
CRESCA: 60% Crypto + 40% RWA
Result: Better risk-adjusted returns
```

### Persona 2: "Traditional Investor" → Adds Crypto Exposure
```
Starting: 100% RWA (stable but boring)
CRESCA: 40% Crypto + 60% RWA
Result: Growth potential + stable income
```

### Persona 3: "Income Seeker" → Maximizes Yield
```
CRESCA Bundle: 20% Crypto + 80% High-Yield RWA
├─ Real Estate (9%)
├─ Bonds (8%)
└─ Invoices (18%)
Result: ~10% blended yield
```

---

## 🔗 Contract Interaction Map

```
User Wallet
    │
    ├─► BundleFactory.createBundle()
    │       │
    │       ├─► Checks KYCRegistry.isVerified() ✓
    │       │
    │       └─► Creates BundleToken
    │               │
    │               └─► VaultManager holds assets
    │                       │
    │                       ├─► Crypto tokens (direct)
    │                       └─► RWA tokens (via RWAVault)
    │
    ├─► YieldDistributor.claimYield()
    │       │
    │       └─► Claims from all RWA tokens in bundle
    │
    └─► PaymentScheduler.createSchedule()
            │
            └─► Auto-invest in bundle monthly
```

---

## 🎉 Conclusion

**CRESCA = The ONLY platform that combines:**

✅ Traditional crypto trading (BTC, ETH, etc.)  
✅ Real-world asset tokenization (RE, bonds, invoices)  
✅ Unified bundle creation (mix both in one token)  
✅ Automatic rebalancing (maintain target weights)  
✅ Compliance built-in (KYC for RWA access)  
✅ Mobile-first experience (manage from phone)  
✅ Mantle Network (ultra-low fees)

**No other platform offers this complete integration!** 🚀
