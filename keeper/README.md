# Payment Keeper Service

Automated keeper service that monitors and executes scheduled payments on the Mantle Network.

## 🎯 What It Does

- ✅ Checks for ready scheduled payments every minute
- ✅ Automatically executes payments when due
- ✅ Updates payment status after execution
- ✅ Logs all activity with timestamps
- ✅ Handles errors gracefully
- ✅ Shows execution statistics

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd keeper
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
KEEPER_PRIVATE_KEY=your_private_key_here
PAYMENT_SCHEDULER_ADDRESS=0xYourDeployedContractAddress
RPC_URL=https://rpc.sepolia.mantle.xyz
CHECK_INTERVAL=60000
```

### 3. Add Keeper to Contract

The keeper wallet must be authorized in the smart contract. Run this **once** as contract owner:

```javascript
// Using ethers.js or hardhat console
await paymentScheduler.addKeeper("0xYourKeeperAddress");
```

### 4. Fund the Keeper Wallet

Send some MNT to the keeper address for gas fees:

```bash
# Testnet: Get from faucet
# Mainnet: Send ~1 MNT for gas
```

### 5. Start the Keeper

```bash
npm start
```

You should see:
```
🚀 Initializing Payment Keeper Service...
📡 Connected to RPC: https://rpc.sepolia.mantle.xyz
👤 Keeper Address: 0x...
💰 Keeper Balance: 1.5 MNT
📝 Contract Address: 0x...
✅ Keeper is authorized!
════════════════════════════════════════════════════════════
⏰ Check Interval: 60 seconds
════════════════════════════════════════════════════════════

🟢 Keeper service started!
```

## 📊 Output Example

```
[1/12/2026, 1:54:30 PM] 🔍 Checking for ready payments...
[1/12/2026, 1:54:30 PM] 📋 Found 3 active schedule(s)
[1/12/2026, 1:54:31 PM] ⚡ Schedule #5 is ready!
   💸 Amount: 0.5 MNT
   👤 Recipient: 0x50921Cd1...
   🔄 Execution: 0/1
[1/12/2026, 1:54:31 PM] 🔄 Executing schedule #5...
[1/12/2026, 1:54:32 PM] 📤 Transaction sent: 0xabc123...
[1/12/2026, 1:54:35 PM] ⏳ Waiting for confirmation...
[1/12/2026, 1:54:38 PM] ✅ SUCCESS! Schedule #5 executed
[1/12/2026, 1:54:38 PM] 🧾 Gas used: 89234
[1/12/2026, 1:54:38 PM] 🔗 Block: 1234567
[1/12/2026, 1:54:38 PM] 💰 Paid: 0.5 MNT to 0x50921Cd1...
[1/12/2026, 1:54:38 PM] 🎉 Schedule #5 marked as COMPLETED
[1/12/2026, 1:54:38 PM] 📊 Summary: 1/1 payments executed
```

## 🛠️ Advanced Usage

### Development Mode (Auto-restart on changes)

```bash
npm run dev
```

### Custom Check Interval

```bash
CHECK_INTERVAL=30000 npm start  # Check every 30 seconds
```

### Run as Background Service

#### Linux/Mac (using PM2):

```bash
npm install -g pm2
pm2 start keeper.js --name payment-keeper
pm2 logs payment-keeper
pm2 stop payment-keeper
```

#### Windows (using forever):

```bash
npm install -g forever
forever start keeper.js
forever logs
forever stop keeper.js
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use dedicated keeper wallet** - Don't use your main wallet
3. **Limit keeper balance** - Only keep enough MNT for gas
4. **Monitor keeper activity** - Check logs regularly
5. **Rotate keys periodically** - Generate new keys every few months

## 📈 Monitoring

### Check Keeper Status

While running, press `Ctrl+C` to see statistics:

```
🛑 Stopping keeper service...
════════════════════════════════════════════════════════════
📊 Final Statistics:
   ✅ Successful executions: 42
   ❌ Failed attempts: 3
════════════════════════════════════════════════════════════
```

### View Logs

```bash
# Real-time logs
tail -f keeper.log

# Search for errors
grep "ERROR" keeper.log

# Count executions
grep "SUCCESS" keeper.log | wc -l
```

## ⚠️ Troubleshooting

### "This address is not authorized as a keeper"

Run as contract owner:
```javascript
await paymentScheduler.addKeeper("0xKeeperAddress");
```

### "Keeper has insufficient funds"

Send MNT to keeper wallet:
```bash
# Get keeper address from logs
# Send 1-2 MNT for gas
```

### "Could not connect to RPC"

Check RPC_URL in `.env`:
```env
RPC_URL=https://rpc.sepolia.mantle.xyz
```

### "Schedule not ready for execution"

Check schedule timing:
- Verify `startTime` has passed
- Check if `interval` time elapsed
- Ensure schedule status is ACTIVE

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Mantle RPC endpoint | `https://rpc.sepolia.mantle.xyz` |
| `KEEPER_PRIVATE_KEY` | Keeper wallet private key | Required |
| `PAYMENT_SCHEDULER_ADDRESS` | Contract address | Required |
| `CHECK_INTERVAL` | Check frequency (ms) | `60000` (1 min) |

## 🔗 Resources

- [Mantle Network Docs](https://docs.mantle.xyz)
- [Ethers.js Documentation](https://docs.ethers.org)
- [PaymentScheduler Contract](../contracts/contracts/PaymentScheduler.sol)

## 📄 License

MIT
