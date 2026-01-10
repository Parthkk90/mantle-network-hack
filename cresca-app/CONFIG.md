# CRESCA App Configuration

## Network Configuration

### Mantle Sepolia Testnet (Current)
```typescript
{
  chainId: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  explorerUrl: 'https://sepolia.mantlescan.xyz',
  currency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  }
}
```

### Mantle Mainnet (Production)
```typescript
{
  chainId: 5000,
  name: 'Mantle',
  rpcUrl: 'https://rpc.mantle.xyz',
  explorerUrl: 'https://mantlescan.xyz',
  currency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  }
}
```

## Smart Contract Addresses

### Testnet (Mantle Sepolia)
- **PaymentProcessor:** `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`

### Mainnet (To Be Deployed)
- **PaymentProcessor:** `TBD`

## Configuration Files

### 1. Network & Contract Config
**File:** `src/config/constants.ts`

```typescript
export const MANTLE_SEPOLIA = {
  chainId: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  explorerUrl: 'https://sepolia.mantlescan.xyz',
  currency: { name: 'MNT', symbol: 'MNT', decimals: 18 }
};

export const PAYMENT_PROCESSOR_ADDRESS = '0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8';
```

### 2. Expo Configuration
**File:** `app.json`

Current settings:
- **Name:** cresca-app
- **Slug:** cresca-app
- **Version:** 1.0.0
- **Platforms:** iOS, Android, Web

### 3. Package Dependencies
**File:** `package.json`

Key dependencies:
```json
{
  "ethers": "^6.13.4",
  "expo-secure-store": "^15.0.8",
  "@react-navigation/native": "^7.1.26",
  "react-native-get-random-values": "~1.11.0"
}
```

## Environment Variables

**No .env file required!** All configuration is in `src/config/constants.ts`

For production deployment:
1. Update `PAYMENT_PROCESSOR_ADDRESS` to mainnet address
2. Change `MANTLE_SEPOLIA` to `MANTLE_MAINNET`
3. Update RPC URL to mainnet

## Security Configuration

### Secure Storage
- **Library:** Expo SecureStore
- **Storage Key:** `user_private_key`
- **Encryption:** Hardware-backed encryption (iOS Keychain, Android Keystore)

### Private Key Handling
- Never logged to console in production
- Never transmitted over network
- Stored only in secure device storage
- Auto-cleared on app uninstall

## Network Requests

### RPC Calls
- **Provider:** ethers.JsonRpcProvider
- **Endpoint:** https://rpc.sepolia.mantle.xyz
- **Timeout:** Default (ethers.js)
- **Retry:** Automatic (ethers.js)

### Contract Calls
- **Read Calls:** Free (no gas)
- **Write Calls:** Requires gas (MNT)
- **Gas Price:** Auto-calculated by network

## Testing Configuration

### Test Wallet
```
Address: 0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d
Private Key: bcc61b58e2ede01b3a06754d3f8e2a4c195ccb55d85343be2cb9583ebd9e1486
Network: Mantle Sepolia Testnet
Balance: ~9996 MNT (after deployments & tests)
```

### Faucet
- **URL:** https://faucet.sepolia.mantle.xyz
- **Limit:** TBD per request
- **Cooldown:** TBD between requests

## Build Configuration

### Development
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## Performance Settings

### Optimization
- **Tree Shaking:** Enabled (Metro bundler)
- **Minification:** Enabled in production
- **Source Maps:** Disabled in production
- **Hermes:** Enabled (React Native 0.70+)

### Bundle Size
- **Development:** ~5MB
- **Production:** ~3MB (minified)

## Monitoring & Analytics

### Error Tracking
- Console errors captured in development
- Production: Add Sentry/Crashlytics

### Transaction Tracking
- All transactions logged to console in dev
- Production: Add analytics service

## Update Configuration

### OTA Updates (Expo)
- **Channel:** production
- **Updates:** Automatic
- **Rollback:** Supported

### App Store Updates
- **iOS:** Manual submission
- **Android:** Manual submission

## Troubleshooting

### Common Config Issues

1. **Provider Connection Failed**
   - Check RPC URL is correct
   - Verify internet connection
   - Try alternative RPC endpoint

2. **Contract Call Failed**
   - Verify contract address is correct
   - Check network (testnet vs mainnet)
   - Ensure sufficient gas

3. **Wallet Import Failed**
   - Check private key format (64 hex chars)
   - Verify no extra spaces
   - Ensure correct network

## Resources

- **Mantle Docs:** https://docs.mantle.xyz
- **Expo Docs:** https://docs.expo.dev
- **ethers.js Docs:** https://docs.ethers.org
- **React Navigation:** https://reactnavigation.org
