# CRESCA Implementation Roadmap

## 🎯 MVP (Week 1-2)

### Core Wallet Features
- [x] Smart contracts compiled
- [x] Contracts deployed to Mantle testnet
- [ ] React Native app
- [ ] Wallet creation/import
- [ ] Show MNT balance
- [ ] Send MNT
- [ ] Receive MNT
- [ ] Transaction history

**Stack:**
- React Native
- ethers.js
- Mantle testnet RPC
- AsyncStorage

### Deployment
```bash
# Already done ✅
npx hardhat run scripts/deployAll.ts --network mantleSepolia
```

## 🚀 Phase 2 (Week 3-4)

- [ ] Bundle token investing
- [ ] Swap integration
- [ ] Scheduled payments
- [ ] Mobile polish

## 🔮 Phase 3 (Later)

- [ ] RWA features
- [ ] Bridge integration
- [ ] Mainnet deployment

---

**Status:** Contracts deployed ✅ | Building wallet MVP 🚧
