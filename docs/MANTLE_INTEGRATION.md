# Mantle Network Integration Guide

## Overview

This document provides essential information about deploying CRESCA contracts on Mantle Network, including network details, bridge contracts, and token lists.

## Network Information

### Mantle Sepolia Testnet
- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://sepolia.mantlescan.xyz
- **Faucet**: https://faucet.sepolia.mantle.xyz

### Mantle Mainnet
- **Chain ID**: 5000
- **RPC URL**: https://rpc.mantle.xyz
- **Explorer**: https://mantlescan.xyz

## Simple Setup

### ethers.js
```javascript
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
const wallet = new ethers.Wallet(privateKey, provider);

// Send transaction
const tx = await wallet.sendTransaction({
  to: recipient,
  value: ethers.parseEther('0.1')
});
```

### Hardhat Config
```typescript
mantleSepolia: {
  url: "https://rpc.sepolia.mantle.xyz",
  chainId: 5003,
  accounts: [process.env.ACCOUNT_PRIVATE_KEY],
  gasPrice: 20000000, // 0.02 gwei
}
```

## Gas Optimization (Mantle v2 Tectonic)

Mantle v2 Tectonic uses EIP-1559 mechanism with the following recommendations:

### Fee Configuration
- **Base Fee**: 0.02 gwei (minimum)
- **Priority Fee**: 0 gwei (recommended)

### Hardhat Configuration
The project is already configured with optimal gas settings:

```typescript
mantleSepolia: {
  url: "https://rpc.sepolia.mantle.xyz",
  chainId: 5003,
  accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
  gasPrice: 20000000, // 0.02 gwei - optimized for Mantle
}
```

### MetaMask Users
For manual transactions via MetaMask:
1. Set Base Fee: 0.02 gwei
2. Set Priority Fee: 0 gwei
3. This provides the lowest possible transaction cost

## Mantle L1/L2 Architecture

### L1 Contracts (Ethereum)

#### L1CrossDomainMessengerProxy
- **Purpose**: Send messages from L1 to L2
- **Use Case**: Cross-chain communication for CRESCA

#### L1StandardBridgeProxy
- **Purpose**: Transfer ERC20 tokens between L1 and L2
- **Use Case**: Bridge user funds for bundle investments

#### L1ERC721BridgeProxy
- **Purpose**: Transfer ERC721 tokens between L1 and L2
- **Use Case**: Future NFT bundle support

#### L2OutputOracleProxy
- **Purpose**: Store L2 state commitments
- **Use Case**: L1 contracts accessing L2 state

#### OptimismPortalProxy
- **Purpose**: Low-level message passing interface
- **Use Case**: Direct L1↔L2 communication

### L2 Contracts (Mantle Network)

CRESCA contracts will be deployed on L2 for:
- Low transaction costs
- Fast finality
- EVM compatibility
- Access to Mantle's DeFi ecosystem

## Token List & Bridge Integration

### Adding Tokens to Mantle Bridge

If CRESCA launches a governance token or needs to bridge tokens:

1. **Deploy L1 Token** (Ethereum)
2. **Deploy L2 Token** (Mantle) - Use Mantle's token template
3. **Submit PR** to [Mantle Token List](https://github.com/mantlenetworkio/mantle-token-list)

### Token Template
For bridge compatibility, tokens should be deployed using Mantle's authorized bridge template.

### Requirements for Token Listing
- L1 token address (Ethereum)
- L2 token address (Mantle)
- Token logo
- Token metadata (name, symbol, decimals)

## DEX Integration on Mantle

CRESCA's SwapRouter will integrate with these Mantle DEXs:

### Primary DEXs
1. **Agni Finance** - Mantle's native DEX
2. **Merchant Moe** - Multi-chain DEX
3. **FusionX** - High-performance DEX

### Integration Steps
1. Get DEX router contract addresses
2. Register routers in SwapRouter contract
3. Test swap routing
4. Monitor liquidity and prices

## Deploy Checklist

- [ ] Get testnet MNT from faucet
- [ ] Set `ACCOUNT_PRIVATE_KEY` in `.env`
- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat run scripts/deployAll.ts --network mantleSepolia`
- [ ] Verify on Mantlescan

## Resources

- [Mantle Docs](https://docs.mantle.xyz)
- [Faucet](https://faucet.sepolia.mantle.xyz)
- [Explorer](https://sepolia.mantlescan.xyz)

## Security Considerations

### Bridge Security
- Understand L1↔L2 messaging delays
- Implement proper access controls
- Monitor bridge events

### Oracle Security
- Use multiple price sources
- Implement fallback mechanisms
- Protect against price manipulation

### Contract Security
- All contracts use OpenZeppelin libraries
- Comprehensive test coverage
- External audit before mainnet

## Monitoring & Analytics

### Block Explorers
- **Mainnet**: https://mantlescan.xyz
- **Testnet**: https://sepolia.mantlescan.xyz

### On-Chain Analytics
- Dune Analytics for Mantle
- Custom subgraphs for CRESCA data
- Real-time monitoring via Tenderly

### Contract Events
Monitor these events for analytics:
- `BundleCreated` - New bundles
- `Deposited` - Bundle investments
- `SwapExecuted` - Swap volume
- `ScheduleCreated` - New scheduled payments

## Useful Resources

### Official Documentation
- [Mantle Network Docs](https://docs.mantle.xyz/network)
- [Deploy Smart Contracts](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-deploy-smart-contracts)
- [Contract Verification](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-verify-smart-contracts)
- [Mantle SDK](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-sdk)
- [Mantle Viem](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-viem)

### Contract Addresses
- [L1 Contracts](https://docs.mantle.xyz/network/system-information/contract-addresses#l1-contracts)
- [L2 Contracts](https://docs.mantle.xyz/network/system-information/contract-addresses#l2-contracts)
- [Token List](https://github.com/mantlenetworkio/mantle-token-list)

### Community
- [Mantle Discord](https://discord.gg/0xmantle)
- [Mantle Twitter](https://twitter.com/0xMantle)
- [Mantle Forum](https://forum.mantle.xyz)

## Rate Limiting

The official Mantle RPC employs rate limiting for stability:

### Solutions
1. **Use Third-Party RPCs** for high-frequency calls
2. **Implement Caching** for read operations
3. **Batch Requests** when possible
4. **Use WebSocket** for real-time data

### Third-Party RPC Providers
- Alchemy
- QuickNode
- Ankr
- Infura

## Next Steps

1. **Test on Sepolia**
   - Deploy all contracts
   - Create test bundles
   - Execute test swaps
   - Test scheduled payments

2. **Integrate DEXs**
   - Get Agni Finance router
   - Register in SwapRouter
   - Test price queries
   - Verify swap execution

3. **Set Up Monitoring**
   - Configure Tenderly alerts
   - Set up block explorer tracking
   - Create analytics dashboard

4. **Prepare for Mainnet**
   - Complete security audit
   - Update documentation
   - Prepare deployment checklist
   - Plan launch strategy

---

**Last Updated**: January 4, 2026
**Network Version**: Mantle v2 Tectonic
**Recommended Solidity**: 0.8.23 or below
