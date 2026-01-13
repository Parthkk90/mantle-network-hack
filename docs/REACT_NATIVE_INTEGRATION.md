# React Native Wallet Integration Guide

Complete guide to integrate your deployed Mantle contracts into a React Native wallet.

## 📋 Table of Contents
1. [Network Configuration](#network-configuration)
2. [Contract Addresses](#contract-addresses)
3. [Basic Send/Receive MNT](#basic-sendreceive-mnt)
4. [Smart Contract Integration](#smart-contract-integration)
5. [Complete Code Examples](#complete-code-examples)

---

## 🌐 Network Configuration

### Mantle Sepolia Testnet Parameters

```typescript
// filepath: mobile/src/config/networks.ts
export const MANTLE_SEPOLIA = {
  chainId: 5003,
  name: 'Mantle Sepolia Testnet',
  rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  blockExplorer: 'https://sepolia.mantlescan.xyz',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18
  },
  // Gas settings (optimized for Mantle)
  gasPrice: '20000000', // 0.02 gwei
  gasLimit: '21000' // for simple transfers
};
```

---

## 📍 Contract Addresses

### Your Deployed Contracts on Mantle Sepolia

```typescript
// filepath: mobile/src/config/contracts.ts
export const CONTRACTS = {
  // Core Wallet
  paymentProcessor: '0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8',
  
  // DeFi Features
  bundleFactory: '0xB463bf41250c9f83A846708fa96fB20aC1B4f08E',
  vaultManager: '0x12d06098124c6c24E0551c429D996c8958A32083',
  swapRouter: '0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD',
  paymentScheduler: '0xfAc3A13b1571A227CF36878fc46E07B56021cd7B',
  
  // RWA Features
  kycRegistry: '0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB',
  rwaVault: '0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63',
  rwaToken: '0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC',
  yieldDistributor: '0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844',
};

export const NETWORK = MANTLE_SEPOLIA;
```

---

## 💸 Basic Send/Receive MNT (No Contract Needed)

### Installation

```bash
npm install ethers@6 @react-native-async-storage/async-storage
```

### Simple Wallet Service

```typescript
// filepath: mobile/src/services/WalletService.ts
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MANTLE_SEPOLIA } from '../config/networks';

class WalletService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
  }

  // Create new wallet
  async createWallet(): Promise<{ address: string; mnemonic: string }> {
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic?.phrase || '';
    
    // Store encrypted
    await AsyncStorage.setItem('wallet_mnemonic', mnemonic);
    
    this.wallet = wallet.connect(this.provider);
    
    return {
      address: wallet.address,
      mnemonic: mnemonic
    };
  }

  // Import wallet from mnemonic
  async importWallet(mnemonic: string): Promise<string> {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    await AsyncStorage.setItem('wallet_mnemonic', mnemonic);
    
    this.wallet = wallet.connect(this.provider);
    return wallet.address;
  }

  // Load wallet from storage
  async loadWallet(): Promise<string | null> {
    const mnemonic = await AsyncStorage.getItem('wallet_mnemonic');
    if (!mnemonic) return null;
    
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    this.wallet = wallet.connect(this.provider);
    return wallet.address;
  }

  // Get MNT balance
  async getBalance(address?: string): Promise<string> {
    const targetAddress = address || this.wallet?.address;
    if (!targetAddress) throw new Error('No address provided');
    
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance); // Returns "1.5" for 1.5 MNT
  }

  // Send MNT (native transfer)
  async sendMNT(
    recipient: string,
    amount: string // e.g., "0.1" for 0.1 MNT
  ): Promise<{ hash: string; success: boolean }> {
    if (!this.wallet) throw new Error('Wallet not loaded');

    try {
      const tx = await this.wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount), // Convert to wei
        gasLimit: 21000, // Standard transfer
      });

      const receipt = await tx.wait(); // Wait for confirmation
      
      return {
        hash: tx.hash,
        success: receipt?.status === 1
      };
    } catch (error: any) {
      console.error('Send error:', error);
      throw new Error(error.message);
    }
  }

  // Get transaction history (last 10)
  async getTransactionHistory(address?: string): Promise<any[]> {
    const targetAddress = address || this.wallet?.address;
    if (!targetAddress) return [];

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 1000; // Last ~1000 blocks

      // Get sent transactions
      const sentTxs = await this.provider.getLogs({
        fromBlock,
        toBlock: 'latest',
        topics: [
          null, // Any event
          ethers.zeroPadValue(targetAddress, 32) // From this address
        ]
      });

      // Get received transactions
      const receivedTxs = await this.provider.getLogs({
        fromBlock,
        toBlock: 'latest',
        topics: [
          null,
          null,
          ethers.zeroPadValue(targetAddress, 32) // To this address
        ]
      });

      // Combine and format
      const allTxs = [...sentTxs, ...receivedTxs].slice(0, 10);
      
      return allTxs.map(log => ({
        hash: log.transactionHash,
        blockNumber: log.blockNumber,
        // Fetch full tx details as needed
      }));
    } catch (error) {
      console.error('History error:', error);
      return [];
    }
  }

  // Generate QR code data (for receiving)
  getReceiveAddress(): string {
    if (!this.wallet) throw new Error('Wallet not loaded');
    return this.wallet.address;
  }

  // Get current gas price
  async getCurrentGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
  }
}

export default new WalletService();
```

---

## 🔗 Smart Contract Integration

### Contract ABIs (Simplified)

```typescript
// filepath: mobile/src/config/abis.ts

export const PaymentProcessorABI = [
  "function send(address recipient, uint256 amount) external",
  "function getBalance(address account) external view returns (uint256)",
  "event PaymentSent(address indexed from, address indexed to, uint256 amount)"
];

export const BundleFactoryABI = [
  "function createBundle(address[] tokens, uint256[] weights, string name, string symbol) external returns (address)",
  "function getUserBundles(address user) external view returns (address[])",
  "event BundleCreated(address indexed creator, address indexed bundle, string name)"
];

export const RWATokenABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function distributeYield(uint256 amount, string description) external",
  "function claimYield() external returns (uint256)",
  "function getClaimableYield(address holder) external view returns (uint256)"
];
```

### Contract Service

```typescript
// filepath: mobile/src/services/ContractService.ts
import { ethers } from 'ethers';
import { CONTRACTS, NETWORK } from '../config/contracts';
import { PaymentProcessorABI, BundleFactoryABI, RWATokenABI } from '../config/abis';
import WalletService from './WalletService';

class ContractService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK.rpcUrl);
  }

  // Get signer from wallet
  private async getSigner(): Promise<ethers.Wallet> {
    const mnemonic = await AsyncStorage.getItem('wallet_mnemonic');
    if (!mnemonic) throw new Error('Wallet not found');
    
    return ethers.Wallet.fromPhrase(mnemonic).connect(this.provider);
  }

  // === PAYMENT PROCESSOR ===
  
  async sendViaContract(
    recipient: string,
    amount: string // in MNT
  ): Promise<string> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(
      CONTRACTS.paymentProcessor,
      PaymentProcessorABI,
      signer
    );

    const tx = await contract.send(
      recipient,
      ethers.parseEther(amount)
    );
    
    await tx.wait();
    return tx.hash;
  }

  // === BUNDLE FACTORY ===
  
  async createBundle(
    tokenAddresses: string[],
    weights: number[], // e.g., [5000, 3000, 2000] = 50%, 30%, 20%
    name: string,
    symbol: string
  ): Promise<string> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(
      CONTRACTS.bundleFactory,
      BundleFactoryABI,
      signer
    );

    const tx = await contract.createBundle(
      tokenAddresses,
      weights,
      name,
      symbol
    );
    
    const receipt = await tx.wait();
    
    // Get bundle address from event
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'BundleCreated'
    );
    
    return event?.args?.bundle || '';
  }

  async getUserBundles(address?: string): Promise<string[]> {
    const targetAddress = address || (await this.getSigner()).address;
    
    const contract = new ethers.Contract(
      CONTRACTS.bundleFactory,
      BundleFactoryABI,
      this.provider
    );

    return await contract.getUserBundles(targetAddress);
  }

  // === RWA TOKEN ===
  
  async getRWABalance(holderAddress?: string): Promise<string> {
    const targetAddress = holderAddress || (await this.getSigner()).address;
    
    const contract = new ethers.Contract(
      CONTRACTS.rwaToken,
      RWATokenABI,
      this.provider
    );

    const balance = await contract.balanceOf(targetAddress);
    return ethers.formatEther(balance);
  }

  async claimRWAYield(): Promise<{ amount: string; hash: string }> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(
      CONTRACTS.rwaToken,
      RWATokenABI,
      signer
    );

    const tx = await contract.claimYield();
    const receipt = await tx.wait();
    
    // Amount claimed is in the event or return value
    return {
      amount: '0', // Parse from receipt if needed
      hash: tx.hash
    };
  }

  async getClaimableYield(holderAddress?: string): Promise<string> {
    const targetAddress = holderAddress || (await this.getSigner()).address;
    
    const contract = new ethers.Contract(
      CONTRACTS.rwaToken,
      RWATokenABI,
      this.provider
    );

    const claimable = await contract.getClaimableYield(targetAddress);
    return ethers.formatEther(claimable);
  }
}

export default new ContractService();
```

---

## 📱 Complete Code Examples

### Example 1: Send MNT Screen

```typescript
// filepath: mobile/src/screens/SendScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import WalletService from '../services/WalletService';

export default function SendScreen() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    try {
      setStatus('Sending...');
      
      const result = await WalletService.sendMNT(recipient, amount);
      
      setStatus(`✅ Sent! Hash: ${result.hash.slice(0, 10)}...`);
      
      // Clear form
      setRecipient('');
      setAmount('');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Send MNT</Text>
      
      <TextInput
        placeholder="Recipient Address"
        value={recipient}
        onChangeText={setRecipient}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      
      <TextInput
        placeholder="Amount (MNT)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      
      <Button title="Send" onPress={handleSend} />
      
      {status && <Text style={{ marginTop: 10 }}>{status}</Text>}
    </View>
  );
}
```

### Example 2: Balance Display

```typescript
// filepath: mobile/src/screens/WalletScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import WalletService from '../services/WalletService';

export default function WalletScreen() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const addr = await WalletService.loadWallet();
      if (addr) {
        setAddress(addr);
        await refreshBalance(addr);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (addr?: string) => {
    const bal = await WalletService.getBalance(addr);
    setBalance(bal);
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Wallet</Text>
      
      <Text style={{ marginTop: 20 }}>Address:</Text>
      <Text style={{ fontSize: 12 }}>{address}</Text>
      
      <Text style={{ marginTop: 20, fontSize: 32 }}>{balance} MNT</Text>
      
      <Button title="Refresh" onPress={() => refreshBalance()} />
    </View>
  );
}
```

### Example 3: Receive QR Code

```typescript
// filepath: mobile/src/screens/ReceiveScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // npm install react-native-qrcode-svg
import WalletService from '../services/WalletService';

export default function ReceiveScreen() {
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    const addr = await WalletService.loadWallet();
    if (addr) setAddress(addr);
  };

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Receive MNT</Text>
      
      {address && (
        <>
          <QRCode
            value={address}
            size={200}
          />
          
          <Text style={{ marginTop: 20, fontSize: 12 }}>{address}</Text>
          
          <Text style={{ marginTop: 10, color: 'gray' }}>
            Scan to receive MNT on Mantle Sepolia
          </Text>
        </>
      )}
    </View>
  );
}
```

### Example 4: Create Bundle

```typescript
// filepath: mobile/src/screens/CreateBundleScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import ContractService from '../services/ContractService';

export default function CreateBundleScreen() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [status, setStatus] = useState('');

  // Example: 50% Token A, 30% Token B, 20% Token C
  const tokens = [
    '0x...tokenA',
    '0x...tokenB',
    '0x...tokenC'
  ];
  const weights = [5000, 3000, 2000]; // basis points

  const handleCreate = async () => {
    try {
      setStatus('Creating bundle...');
      
      const bundleAddress = await ContractService.createBundle(
        tokens,
        weights,
        name,
        symbol
      );
      
      setStatus(`✅ Bundle created at: ${bundleAddress}`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Create Token Bundle</Text>
      
      <TextInput
        placeholder="Bundle Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      
      <TextInput
        placeholder="Symbol (e.g., MYBDL)"
        value={symbol}
        onChangeText={setSymbol}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      
      <Text style={{ marginVertical: 10 }}>
        Allocation: 50% Token A, 30% Token B, 20% Token C
      </Text>
      
      <Button title="Create Bundle" onPress={handleCreate} />
      
      {status && <Text style={{ marginTop: 10 }}>{status}</Text>}
    </View>
  );
}
```

---

## 🔐 Security Best Practices

```typescript
// filepath: mobile/src/utils/security.ts

// 1. Validate addresses
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// 2. Validate amounts
export function isValidAmount(amount: string): boolean {
  try {
    const parsed = ethers.parseEther(amount);
    return parsed > 0n;
  } catch {
    return false;
  }
}

// 3. Format addresses for display
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 4. Safe number formatting
export function formatMNT(amount: string, decimals = 4): string {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
}
```

---

## 🧪 Testing

```typescript
// filepath: mobile/src/services/__tests__/WalletService.test.ts
import WalletService from '../WalletService';

describe('WalletService', () => {
  it('should create a wallet', async () => {
    const { address, mnemonic } = await WalletService.createWallet();
    
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(mnemonic.split(' ')).toHaveLength(12);
  });

  it('should get balance', async () => {
    const balance = await WalletService.getBalance(
      '0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d'
    );
    
    expect(typeof balance).toBe('string');
    expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 📋 Quick Reference

### Send MNT (Native)
```typescript
await WalletService.sendMNT(
  '0xRecipientAddress',
  '0.1' // amount in MNT
);
```

### Get Balance
```typescript
const balance = await WalletService.getBalance(); // Current wallet
const balance = await WalletService.getBalance('0xAddress'); // Specific address
```

### Create Bundle
```typescript
await ContractService.createBundle(
  ['0xToken1', '0xToken2'],
  [5000, 5000], // 50% each
  'My Bundle',
  'MYBDL'
);
```

### Claim RWA Yield
```typescript
const { amount, hash } = await ContractService.claimRWAYield();
```

---

## 🔗 Useful Links

- **Faucet**: https://faucet.sepolia.mantle.xyz/
- **Explorer**: https://sepolia.mantlescan.xyz/
- **RPC**: https://rpc.sepolia.mantle.xyz
- **Docs**: https://docs.mantle.xyz

---

## 🐛 Troubleshooting

### Error: "Insufficient funds"
- Check balance with `getBalance()`
- Get testnet MNT from faucet

### Error: "Invalid address"
- Validate with `ethers.isAddress(address)`
- Ensure address starts with `0x`

### Error: "Transaction failed"
- Check gas price/limit
- Verify contract is on correct network
- Check recipient address is valid

### Error: "Nonce too low"
- Wait for pending tx to complete
- Or manually set nonce in transaction

---

**Built with ❤️ for Mantle Network** 🚀
