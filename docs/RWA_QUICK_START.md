# RWA Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd contracts
npm install
```

### 2. Deploy RWA Contracts
```bash
# Deploy to Mantle Testnet
npx hardhat run scripts/deploy-rwa.ts --network mantle-testnet

# Deploy to Mantle Mainnet
npx hardhat run scripts/deploy-rwa.ts --network mantle
```

### 3. Verify Contracts
```bash
# Addresses will be in rwa-deployment.json
npx hardhat verify --network mantle <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Quick Examples

### Example 1: Tokenize Real Estate (2 minutes)

```solidity
// 1. Deploy RWA token for a property
RWAToken property = new RWAToken(
    "Miami Beach Condo 123",      // Name
    "RWA-MIA123",                  // Symbol
    AssetType.REAL_ESTATE,         // Type
    "123 Ocean Dr, Miami",         // Identifier
    50000000,                      // $500,000
    "Qm...",                       // Legal docs IPFS hash
    kycRegistryAddress,
    vaultAddress
);

// 2. Mint tokens to verified investors
property.mint(investorAddress, 100000); // $100k worth

// 3. Distribute monthly rent
property.distributeYield(5000 * 1e6, "January 2026 Rent");

// 4. Investors claim yield
property.claimYield();
```

### Example 2: KYC Verification (1 minute)

```solidity
// Verify a user
kycRegistry.verifyKYC(
    userAddress,
    KYCTier.INTERMEDIATE,          // Tier
    "US",                          // Jurisdiction
    365,                           // Valid for 1 year
    false,                         // Not accredited
    keccak256("kyc-docs"),         // Document hash
    "Onfido"                       // Provider
);

// Check if verified
bool isVerified = kycRegistry.isVerified(userAddress);
```

### Example 3: Invoice Factoring (3 minutes)

```solidity
// 1. Create invoice
uint256 invoiceId = factoring.createInvoice(
    buyerAddress,
    100000 * 1e6,                  // $100k
    block.timestamp + 60 days,     // Due in 60 days
    "Qm...",                       // Invoice IPFS hash
    usdcAddress
);

// 2. Verify and set discount
factoring.verifyInvoice(invoiceId, 300); // 3% discount

// 3. Fund invoice (seller gets paid immediately)
factoring.fundInvoice(invoiceId);
// Seller receives: $97,000

// 4. Buyer pays at maturity
factoring.payInvoice(invoiceId);
// Platform profit: $3,000
```

### Example 4: Yield Distribution (2 minutes)

```solidity
// 1. Create distribution
uint256 distId = yieldDistributor.createDistribution(
    rwaTokenAddress,
    usdcAddress,
    50000 * 1e6,                   // $50k total yield
    30,                            // 30 days to claim
    "Q1 2026 Dividends"
);

// 2. Holders claim their share
yieldDistributor.claimYield(distId);

// 3. Check claimable amount
(uint256 gross, uint256 net, uint256 tax) = 
    yieldDistributor.getClaimableAmount(distId, holderAddress);
```

### Example 5: Secure Custody (4 minutes)

```solidity
// 1. Deposit to vault
vault.depositAsset(
    usdcAddress,
    1000000 * 1e6,                 // $1M
    "Property Sale Proceeds"
);

// 2. Request withdrawal (starts 2-day timelock)
uint256 requestId = vault.requestWithdrawal(
    usdcAddress,
    recipientAddress,
    100000 * 1e6,                  // $100k
    "Distribution to investors"
);

// 3. Multi-sig approvals
vault.approveWithdrawal(requestId); // Custodian 1
vault.approveWithdrawal(requestId); // Custodian 2

// 4. Execute after timelock (48 hours)
vault.executeWithdrawal(requestId);
```

## Common Patterns

### Pattern 1: Create RWA Bundle

```solidity
// Mix crypto + RWA in one bundle
address[] memory tokens = new address[](4);
tokens[0] = wbtcAddress;           // 30% BTC
tokens[1] = wethAddress;           // 30% ETH
tokens[2] = realEstateToken;       // 20% Real Estate
tokens[3] = bondToken;             // 20% Bonds

uint256[] memory weights = new uint256[](4);
weights[0] = 3000;
weights[1] = 3000;
weights[2] = 2000;
weights[3] = 2000;

bundleFactory.createBundle(tokens, weights, "Diversified Portfolio");
```

### Pattern 2: Tax-Compliant Distribution

```solidity
// Set jurisdiction tax rules
yieldDistributor.setTaxWithholding(
    "US",
    3000,                          // 30% withholding
    taxAuthorityAddress
);

// When investor claims:
// - Gross amount calculated
// - Tax automatically withheld
// - Net amount sent to investor
// - Tax sent to authority
```

### Pattern 3: Tiered Access

```solidity
// Set jurisdiction rules
kycRegistry.setJurisdictionRules(
    "US",
    true,                          // Allowed
    0,                             // No max (for accredited)
    KYCTier.ADVANCED,              // Requires accreditation
    true                           // Must be accredited
);

// Verify accredited investor
kycRegistry.verifyKYC(
    investorAddress,
    KYCTier.ADVANCED,
    "US",
    365,
    true,                          // Is accredited ✓
    docHash,
    "VerifyInvestor"
);
```

## Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test
```bash
npx hardhat test test/RWAToken.test.ts
npx hardhat test test/KYCRegistry.test.ts
npx hardhat test test/YieldDistributor.test.ts
```

### Test Coverage
```bash
npx hardhat coverage
```

## Contract Addresses

### Mantle Testnet
```
KYCRegistry:        TBD
RWAVault:           TBD
YieldDistributor:   TBD
InvoiceFactoring:   TBD
```

### Mantle Mainnet
```
KYCRegistry:        TBD
RWAVault:           TBD
YieldDistributor:   TBD
InvoiceFactoring:   TBD
```

## Integration Checklist

- [ ] Deploy KYCRegistry
- [ ] Deploy RWAVault
- [ ] Deploy YieldDistributor
- [ ] Deploy InvoiceFactoring
- [ ] Configure jurisdiction rules
- [ ] Setup tax withholding
- [ ] Grant roles to operators
- [ ] Verify contracts on explorer
- [ ] Setup KYC provider integration
- [ ] Test end-to-end flow

## Common Issues

### Issue: "Not KYC verified"
**Solution**: Verify user with `kycRegistry.verifyKYC()`

### Issue: "Insufficient liquidity"
**Solution**: Add liquidity to factoring pool with `addLiquidity()`

### Issue: "Timelock not expired"
**Solution**: Wait 48 hours after withdrawal request

### Issue: "Transfer restricted"
**Solution**: Whitelist recipient or disable restrictions

## Resources

- [Full Documentation](../docs/RWA_REALFI_IMPLEMENTATION.md)
- [Architecture](../ARCHITECTURE.md)
- [API Reference](../docs/API_REFERENCE.md)
- [Mantle Docs](https://docs.mantle.xyz)

## Support

- GitHub Issues: [Create Issue](https://github.com/your-org/cresca/issues)
- Discord: [Join Community](#)
- Email: support@cresca.xyz

---

**Ready to tokenize real-world assets!** 🚀
