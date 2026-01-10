# CRESCA PaymentProcessor - React Native Integration

## Contract Details

**Address:** `0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`  
**Network:** Mantle Sepolia Testnet  
**Chain ID:** 5003  
**RPC:** `https://rpc.sepolia.mantle.xyz`

---

## Installation

```bash
npm install ethers react-native-dotenv @react-native-async-storage/async-storage react-native-get-random-values
```

---

## Configuration

**config/blockchain.ts**

```typescript
export const PAYMENT_PROCESSOR_ADDRESS = '0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8';
export const RPC_URL = 'https://rpc.sepolia.mantle.xyz';
export const CHAIN_ID = 5003;

export const PAYMENT_ABI = [
  "function sendMNT(address payable recipient, string calldata note) external payable returns (uint256)",
  "function sendToken(address token, address recipient, uint256 amount, string calldata note) external returns (uint256)",
  "function getUserSentPayments(address user) external view returns (uint256[])",
  "function getUserReceivedPayments(address user) external view returns (uint256[])",
  "function payments(uint256) external view returns (uint256 id, address sender, address recipient, address token, uint256 amount, uint256 timestamp, string memory note, uint8 paymentType)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];
```

---

## Send MNT

```typescript
import { ethers } from 'ethers';
import { PAYMENT_PROCESSOR_ADDRESS, PAYMENT_ABI, RPC_URL } from './config/blockchain';

async function sendMNT(privateKey: string, recipient: string, amount: string, note: string) {
  // Setup
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_ABI, wallet);
  
  // Send
  const tx = await contract.sendMNT(recipient, note, {
    value: ethers.parseEther(amount)
  });
  
  const receipt = await tx.wait();
  return receipt.hash;
}

// Usage
const txHash = await sendMNT(
  "0x...",                                    // Your private key
  "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d", // Recipient
  "0.1",                                      // Amount in MNT
  "Payment"                                   // Note
);
```

---

## Send ERC20 Token

```typescript
async function sendToken(
  privateKey: string,
  tokenAddress: string,
  recipient: string,
  amount: string,
  note: string
) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_ABI, wallet);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  
  // Get decimals
  const decimals = await token.decimals();
  const amountWei = ethers.parseUnits(amount, decimals);
  
  // Approve token spend
  const approveTx = await token.approve(PAYMENT_PROCESSOR_ADDRESS, amountWei);
  await approveTx.wait();
  
  // Send token
  const tx = await contract.sendToken(tokenAddress, recipient, amountWei, note);
  const receipt = await tx.wait();
  return receipt.hash;
}

// Usage
const txHash = await sendToken(
  "0x...",                                    // Your private key
  "0xTokenAddress...",                        // Token contract (USDC, etc.)
  "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d", // Recipient
  "100",                                      // Amount (100 tokens)
  "Payment"                                   // Note
);
```

---

## Get Balance

```typescript
async function getBalance(privateKey: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance); // Returns string like "1.5"
}

async function getTokenBalance(privateKey: string, tokenAddress: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  const balance = await token.balanceOf(wallet.address);
  const decimals = await token.decimals();
  return ethers.formatUnits(balance, decimals);
}
```

---

## Get Payment History

```typescript
async function getPaymentHistory(address: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_ABI, provider);
  
  // Get payment IDs
  const sentIds = await contract.getUserSentPayments(address);
  const receivedIds = await contract.getUserReceivedPayments(address);
  
  // Get details
  const sent = await Promise.all(
    sentIds.map(async (id) => {
      const p = await contract.payments(id);
      return {
        id: id.toString(),
        recipient: p.recipient,
        amount: ethers.formatEther(p.amount),
        timestamp: new Date(Number(p.timestamp) * 1000),
        note: p.note
      };
    })
  );
  
  const received = await Promise.all(
    receivedIds.map(async (id) => {
      const p = await contract.payments(id);
      return {
        id: id.toString(),
        sender: p.sender,
        amount: ethers.formatEther(p.amount),
        timestamp: new Date(Number(p.timestamp) * 1000),
        note: p.note
      };
    })
  );
  
  return { sent, received };
}
```

---

## React Native Component

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { ethers } from 'ethers';

export default function SendPayment() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
      const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
      const contract = new ethers.Contract(
        '0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8',
        ["function sendMNT(address payable recipient, string calldata note) external payable returns (uint256)"],
        wallet
      );
      
      const tx = await contract.sendMNT(recipient, 'Payment', {
        value: ethers.parseEther(amount)
      });
      
      await tx.wait();
      Alert.alert('Success', `Sent ${amount} MNT`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Recipient Address:</Text>
      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        placeholder="0x..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Text>Amount (MNT):</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.1"
        keyboardType="decimal-pad"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Button title={loading ? "Sending..." : "Send"} onPress={send} disabled={loading} />
    </View>
  );
}
```

---

## Function Parameters

### sendMNT()
- **recipient:** `string` - Wallet address (0x...)
- **note:** `string` - Payment description
- **value:** Send MNT with transaction

### sendToken()
- **token:** `string` - Token contract address
- **recipient:** `string` - Wallet address (0x...)
- **amount:** `bigint` - Amount in token's smallest unit
- **note:** `string` - Payment description

---

## Security Notes

1. **Never expose private keys in code**
2. Store keys in secure storage (react-native-keychain)
3. Use environment variables for sensitive data
4. Test on testnet before mainnet

---

## Explorer Links

**View Transaction:** `https://sepolia.mantlescan.xyz/tx/{txHash}`  
**View Address:** `https://sepolia.mantlescan.xyz/address/{address}`  
**View Contract:** `https://sepolia.mantlescan.xyz/address/0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8`

---

## Common Token Addresses (Mantle Sepolia)

You'll need to deploy or find testnet tokens. Native MNT doesn't require a token address (use `sendMNT` instead).
