# 🎉 CRESCA Deployment Summary

**Network:** Mantle Sepolia Testnet  
**Chain ID:** 5003  
**Status:** ✅ All contracts deployed  

---

## 📦 Deployed Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **SwapRouter** | `0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD` | Token swaps |
| **VaultManager** | `0x12d06098124c6c24E0551c429D996c8958A32083` | Asset custody |
| **BundleFactory** | `0xB463bf41250c9f83A846708fa96fB20aC1B4f08E` | Create token bundles |
| **PaymentScheduler** | `0xfAc3A13b1571A227CF36878fc46E07B56021cd7B` | Scheduled payments |
| **PaymentProcessor** | `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8` | Send/receive |
| **KYCRegistry** | `0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB` | KYC compliance |
| **RWAVault** | `0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63` | RWA custody |
| **RWAToken** | `0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC` | RWA tokens |
| **YieldDistributor** | `0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844` | Yield distribution |

---

## 🔧 Quick Integration

```typescript
const addresses = {
  paymentProcessor: "0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8",
  bundleFactory: "0xB463bf41250c9f83A846708fa96fB20aC1B4f08E",
  swapRouter: "0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD",
};
```

---

## ✅ Next Steps

1. **Build Mobile Wallet**
   - React Native app
   - Connect to contracts
   - Send/receive MNT

2. **Test Features**
   - Create test bundle
   - Execute swap
   - Schedule payment

3. **Deploy to Mainnet** (when ready)
   - Test thoroughly on testnet
   - Security audit
   - Deploy to Mantle mainnet (Chain ID 5000)

---

**Deployer:** https://sepolia.mantlescan.xyz/address/0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d
