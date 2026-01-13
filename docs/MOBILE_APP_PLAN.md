# CRESCA Mobile App Development Plan

## 🎯 Overview

CRESCA mobile app will be built using **React Native** to provide a unified experience across iOS and Android, leveraging **Mantle Network's L2** for ultra-low fees and fast transactions.

---

## 📱 Mobile App Architecture

### Tech Stack

```
React Native 0.73+
├── Navigation: React Navigation 6.x
├── State Management: Redux Toolkit + RTK Query
├── Web3 Integration: Viem + Wagmi (Mantle-optimized)
├── Wallet: WalletConnect v2 + Embedded Wallet
├── Secure Storage: React Native MMKV
├── UI Components: React Native Paper + Custom
├── Charts: Victory Native
├── QR Codes: react-native-camera + react-native-qrcode-svg
└── Testing: Jest + Detox
```

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Navigation)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Business Logic Layer            │
│  (Redux Store, Custom Hooks, Utils)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Web3 Integration Layer          │
│  (Viem Client, Contract Interactions)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Mantle Network (L2)             │
│  (Smart Contracts, RPC, Indexers)       │
└─────────────────────────────────────────┘
```

---

## 🔧 Mantle SDK Integration

### 1. Viem + Mantle Configuration

Based on [How to Use Mantle Viem](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-viem):

```typescript
// src/config/mantle.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantle, mantleSepoliaTestnet } from 'viem/chains';

// Public client for reading blockchain data
export const mantlePublicClient = createPublicClient({
  chain: mantle, // or mantleSepoliaTestnet for testing
  transport: http('https://rpc.mantle.xyz'),
});

// Wallet client for signing transactions
export const createMantleWalletClient = (privateKey: string) => {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: mantle,
    transport: http('https://rpc.mantle.xyz'),
  });
};

// Contract ABIs
export const contractAddresses = {
  bundleFactory: '0xB463bf41250c9f83A846708fa96fB20aC1B4f08E',
  swapRouter: '0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD',
  paymentScheduler: '0xfAc3A13b1571A227CF36878fc46E07B56021cd7B',
  // ... RWA contracts
};
```

### 2. Wagmi Configuration (React Hooks)

```typescript
// src/config/wagmi.ts
import { configureChains, createConfig } from 'wagmi';
import { mantle, mantleSepoliaTestnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { InjectedConnector } from 'wagmi/connectors/injected';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mantle, mantleSepoliaTestnet],
  [publicProvider()]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'MetaMask',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});
```

### 3. Mantle SDK Usage (for L1 ↔ L2 Bridge)

Based on [How to Use Mantle SDK](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-sdk):

```typescript
// src/utils/mantleSDK.ts
import { CrossChainMessenger } from '@mantlenetworkio/sdk';
import { ethers } from 'ethers';

export const initializeMantleSDK = (
  l1Signer: ethers.Signer,
  l2Signer: ethers.Signer
) => {
  return new CrossChainMessenger({
    l1ChainId: 1, // Ethereum mainnet
    l2ChainId: 5000, // Mantle mainnet
    l1SignerOrProvider: l1Signer,
    l2SignerOrProvider: l2Signer,
  });
};

// Deposit ERC20 from L1 to L2
export const bridgeToMantle = async (
  sdk: CrossChainMessenger,
  l1TokenAddress: string,
  amount: string
) => {
  const tx = await sdk.depositERC20(
    l1TokenAddress,
    l1TokenAddress, // L2 token address (same for standard bridge)
    amount
  );
  
  await tx.wait();
  return tx.hash;
};

// Withdraw from L2 to L1
export const bridgeFromMantle = async (
  sdk: CrossChainMessenger,
  l2TokenAddress: string,
  amount: string
) => {
  const tx = await sdk.withdrawERC20(
    l2TokenAddress,
    l2TokenAddress,
    amount
  );
  
  await tx.wait();
  return tx.hash;
};
```

---

## 📂 Mobile App Structure

```
cresca-mobile/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Button, Input, Card, etc.
│   │   ├── wallet/          # WalletBalance, TokenList
│   │   ├── bundle/          # BundleCard, CreateBundleForm
│   │   ├── swap/            # SwapInterface, TokenSelector
│   │   └── schedule/        # ScheduleCard, PaymentHistory
│   │
│   ├── screens/             # Main app screens
│   │   ├── auth/            # Welcome, CreateWallet, ImportWallet
│   │   ├── wallet/          # WalletHome, TokenDetail, Send, Receive
│   │   ├── bundles/         # BundleList, BundleDetail, CreateBundle
│   │   ├── swap/            # SwapScreen, SwapHistory
│   │   ├── schedule/        # ScheduleList, CreateSchedule
│   │   └── settings/        # Settings, Security, About
│   │
│   ├── navigation/          # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   │
│   ├── store/               # Redux store
│   │   ├── slices/          # wallet, bundles, swaps, schedules
│   │   ├── api/             # RTK Query API definitions
│   │   └── index.ts
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useWallet.ts
│   │   ├── useBundles.ts
│   │   ├── useSwap.ts
│   │   └── useSchedule.ts
│   │
│   ├── services/            # Business logic
│   │   ├── walletService.ts
│   │   ├── bundleService.ts
│   │   ├── swapService.ts
│   │   ├── scheduleService.ts
│   │   └── mantleService.ts
│   │
│   ├── contracts/           # Contract ABIs and addresses
│   │   ├── abis/
│   │   └── addresses.ts
│   │
│   ├── utils/               # Helper functions
│   │   ├── crypto.ts
│   │   ├── formatting.ts
│   │   └── validation.ts
│   │
│   ├── config/              # App configuration
│   │   ├── mantle.ts
│   │   ├── wagmi.ts
│   │   └── constants.ts
│   │
│   └── assets/              # Images, fonts, etc.
│
├── package.json
└── app.json
```

---

## 🎨 Key Screens & Features

### 1. Wallet Tab

#### WalletHome Screen
```typescript
// src/screens/wallet/WalletHome.tsx
import { useAccount, useBalance } from 'wagmi';
import { mantlePublicClient } from '@/config/mantle';

export const WalletHome = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // Fetch token list
  const tokens = useTokenList(address);
  
  return (
    <ScrollView>
      <BalanceCard balance={balance} />
      <QuickActions onSend={...} onReceive={...} />
      <TokenList tokens={tokens} />
      <TransactionHistory address={address} />
    </ScrollView>
  );
};
```

#### Send Screen
```typescript
// QR code scanning for recipient address
import { Camera } from 'react-native-camera';

const scanQRCode = async () => {
  const result = await camera.takePictureAsync();
  const address = parseQRCode(result);
  setRecipient(address);
};
```

### 2. Bundles Tab

#### Create Bundle Screen
```typescript
// src/screens/bundles/CreateBundle.tsx
import { useContractWrite } from 'wagmi';
import { bundleFactoryABI } from '@/contracts/abis';

export const CreateBundle = () => {
  const { write: createBundle } = useContractWrite({
    address: contractAddresses.bundleFactory,
    abi: bundleFactoryABI,
    functionName: 'createBundle',
  });
  
  const handleCreate = async (tokens: Address[], weights: number[]) => {
    await createBundle({
      args: [tokens, weights, bundleName, bundleSymbol],
    });
  };
  
  return (
    <View>
      <TokenSelector multiple onSelect={setTokens} />
      <WeightSliders tokens={tokens} onChange={setWeights} />
      <Button onPress={handleCreate}>Create Bundle</Button>
    </View>
  );
};
```

#### Bundle Detail Screen
```typescript
// Real-time bundle performance tracking
import { LineChart } from 'react-native-chart-kit';

const BundleDetail = ({ bundleId }) => {
  const bundleData = useBundlePerformance(bundleId);
  
  return (
    <ScrollView>
      <BundleHeader bundle={bundleData} />
      <PerformanceChart data={bundleData.history} />
      <TokenAllocation tokens={bundleData.tokens} />
      <ActionButtons onInvest={...} onWithdraw={...} />
    </ScrollView>
  );
};
```

### 3. Swap Tab

#### Swap Screen
```typescript
// src/screens/swap/SwapScreen.tsx
import { useContractRead, useContractWrite } from 'wagmi';

export const SwapScreen = () => {
  // Get best price quote
  const { data: quote } = useContractRead({
    address: contractAddresses.swapRouter,
    abi: swapRouterABI,
    functionName: 'getBestPrice',
    args: [tokenIn, tokenOut, amountIn],
  });
  
  // Execute swap
  const { write: executeSwap } = useContractWrite({
    address: contractAddresses.swapRouter,
    abi: swapRouterABI,
    functionName: 'swap',
  });
  
  return (
    <View>
      <TokenInput 
        token={tokenIn} 
        amount={amountIn}
        onTokenSelect={setTokenIn}
      />
      <SwapIcon onPress={reverseTokens} />
      <TokenInput 
        token={tokenOut}
        amount={quote?.amountOut}
        onTokenSelect={setTokenOut}
      />
      <PriceInfo quote={quote} />
      <Button onPress={() => executeSwap({ args: [...] })}>
        Swap
      </Button>
    </View>
  );
};
```

### 4. Schedule Tab

#### Create Schedule Screen
```typescript
// src/screens/schedule/CreateSchedule.tsx
import DateTimePicker from '@react-native-community/datetimepicker';

export const CreateSchedule = () => {
  const { write: createSchedule } = useContractWrite({
    address: contractAddresses.paymentScheduler,
    abi: paymentSchedulerABI,
    functionName: 'createSchedule',
  });
  
  return (
    <ScrollView>
      <ScheduleTypeSelector 
        types={['ONE_TIME', 'RECURRING', 'DCA']}
        selected={scheduleType}
        onChange={setScheduleType}
      />
      <TokenSelector token={token} onSelect={setToken} />
      <AddressInput value={recipient} onChange={setRecipient} />
      <AmountInput value={amount} onChange={setAmount} />
      <DateTimePicker value={startDate} onChange={setStartDate} />
      {scheduleType === 'RECURRING' && (
        <IntervalSelector value={interval} onChange={setInterval} />
      )}
      <Button onPress={handleCreate}>Create Schedule</Button>
    </ScrollView>
  );
};
```

---

## 🔐 Security Implementation

### 1. Secure Key Storage

```typescript
// src/services/secureStorage.ts
import { MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

const storage = new MMKV({
  id: 'cresca-secure-storage',
  encryptionKey: 'your-encryption-key',
});

// Store private key securely
export const storePrivateKey = async (privateKey: string) => {
  await Keychain.setGenericPassword('privateKey', privateKey, {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

// Retrieve private key
export const getPrivateKey = async () => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? credentials.password : null;
};
```

### 2. Biometric Authentication

```typescript
// src/services/biometrics.ts
import ReactNativeBiometrics from 'react-native-biometrics';

export const authenticateWithBiometrics = async () => {
  const rnBiometrics = new ReactNativeBiometrics();
  
  const { success } = await rnBiometrics.simplePrompt({
    promptMessage: 'Authenticate to access your wallet',
  });
  
  return success;
};
```

### 3. Transaction Confirmation

```typescript
// Always show confirmation before signing
const confirmTransaction = async (tx: TransactionRequest) => {
  const confirmed = await showAlert({
    title: 'Confirm Transaction',
    message: `
      To: ${tx.to}
      Amount: ${formatEther(tx.value)} MNT
      Gas: ${formatGwei(tx.gasPrice)} gwei
    `,
    buttons: ['Cancel', 'Confirm'],
  });
  
  if (confirmed) {
    return await walletClient.sendTransaction(tx);
  }
};
```

---

## 📊 Real-Time Data Integration

### 1. Price Feeds

```typescript
// src/services/priceService.ts
import { mantlePublicClient } from '@/config/mantle';

export const usePriceFeed = (tokenAddress: Address) => {
  return useQuery({
    queryKey: ['price', tokenAddress],
    queryFn: async () => {
      // Fetch from DEX or price oracle
      const price = await mantlePublicClient.readContract({
        address: contractAddresses.priceOracle,
        abi: priceOracleABI,
        functionName: 'getPrice',
        args: [tokenAddress],
      });
      return price;
    },
    refetchInterval: 10000, // Update every 10 seconds
  });
};
```

### 2. WebSocket for Real-Time Updates

```typescript
// src/services/websocketService.ts
import { createPublicClient, webSocket } from 'viem';

const wsClient = createPublicClient({
  chain: mantle,
  transport: webSocket('wss://ws.mantle.xyz'),
});

// Listen for new blocks
export const subscribeToBlocks = (callback: (block: Block) => void) => {
  return wsClient.watchBlocks({
    onBlock: callback,
  });
};

// Listen for contract events
export const subscribeToEvents = (
  contractAddress: Address,
  eventName: string,
  callback: (log: Log) => void
) => {
  return wsClient.watchContractEvent({
    address: contractAddress,
    abi: contractABI,
    eventName,
    onLogs: callback,
  });
};
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Jest)

```typescript
// src/services/__tests__/walletService.test.ts
import { formatBalance, validateAddress } from '../walletService';

describe('WalletService', () => {
  test('formats balance correctly', () => {
    expect(formatBalance('1000000000000000000')).toBe('1.00');
  });
  
  test('validates Mantle addresses', () => {
    expect(validateAddress('0x123...')).toBe(true);
  });
});
```

### 2. Integration Tests (Detox)

```typescript
// e2e/wallet.test.js
describe('Wallet Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should create new wallet', async () => {
    await element(by.id('create-wallet-btn')).tap();
    await element(by.id('confirm-seed-btn')).tap();
    await expect(element(by.id('wallet-home'))).toBeVisible();
  });
  
  it('should send transaction', async () => {
    await element(by.id('send-btn')).tap();
    await element(by.id('recipient-input')).typeText('0x123...');
    await element(by.id('amount-input')).typeText('0.1');
    await element(by.id('confirm-send-btn')).tap();
    await expect(element(by.text('Transaction Sent'))).toBeVisible();
  });
});
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "react-navigation": "^6.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",
    
    "viem": "^2.x",
    "wagmi": "^2.x",
    "@mantlenetworkio/sdk": "latest",
    
    "react-native-mmkv": "^2.x",
    "react-native-keychain": "^8.x",
    "react-native-biometrics": "^3.x",
    
    "@reduxjs/toolkit": "^2.x",
    "react-redux": "^9.x",
    "@tanstack/react-query": "^5.x",
    
    "react-native-paper": "^5.x",
    "react-native-vector-icons": "^10.x",
    "react-native-chart-kit": "^6.x",
    "victory-native": "^36.x",
    
    "react-native-camera": "^4.x",
    "react-native-qrcode-svg": "^6.x",
    "@react-native-community/datetimepicker": "^7.x",
    
    "ethers": "^6.x"
  },
  "devDependencies": {
    "jest": "^29.x",
    "detox": "^20.x",
    "@testing-library/react-native": "^12.x"
  }
}
```

---

## 🚀 Development Roadmap

### Phase 1: Core Wallet (Weeks 1-2)
- [x] Project setup with React Native
- [ ] Wallet creation/import
- [ ] Secure key storage
- [ ] Connect to Mantle Network
- [ ] Display balances
- [ ] Send/receive MNT
- [ ] Transaction history

### Phase 2: Bundle Features (Weeks 3-4)
- [ ] Create bundle interface
- [ ] Invest in bundles
- [ ] Withdraw from bundles
- [ ] Bundle performance tracking
- [ ] Portfolio overview

### Phase 3: Swap Features (Week 5)
- [ ] Token selection
- [ ] Price quotes
- [ ] Execute swaps
- [ ] Swap history
- [ ] Slippage settings

### Phase 4: Schedule Features (Week 6)
- [ ] Create schedules
- [ ] Schedule management
- [ ] Calendar view
- [ ] Payment notifications
- [ ] History tracking

### Phase 5: Polish & Testing (Weeks 7-8)
- [ ] UI/UX refinements
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] Comprehensive testing
- [ ] Beta release

---

## 📚 Useful Resources

### Mantle Documentation
- [Mantle Network Overview](https://docs.mantle.xyz/network)
- [Deploy Smart Contracts](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-deploy-smart-contracts)
- [Use Mantle SDK](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-sdk)
- [Use Mantle Viem](https://docs.mantle.xyz/network/for-developers/how-to-guides/how-to-use-mantle-viem)
- [Mantle Tutorials](https://github.com/mantlenetworkio/mantle-tutorial)

### React Native Resources
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Wagmi React Hooks](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

---

## 🎉 Conclusion

This plan provides a complete blueprint for building the CRESCA mobile app using:

✅ **React Native** for cross-platform development  
✅ **Viem + Wagmi** for Mantle Network integration  
✅ **Mantle SDK** for L1 ↔ L2 bridging  
✅ **Secure storage** for private keys  
✅ **Real-time updates** via WebSocket  
✅ **Comprehensive testing** with Jest + Detox

**Ready to build the best DeFi wallet on Mantle Network!** 🚀
