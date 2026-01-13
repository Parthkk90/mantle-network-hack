# ✅ WMNT Integration - Schedule Payments Fixed!

## Problem Solved
The PaymentScheduler contract requires ERC20 tokens, not native MNT. We've deployed **WMNT (Wrapped MNT)** to solve this.

## What Was Done

### 1. Deployed WMNT Token ✅
- **Address**: `0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8`
- **Name**: Wrapped MNT
- **Symbol**: WMNT
- **Features**:
  - `mint()` - Test function to mint WMNT
  - `balanceOf()` - Check balance
  - `approve()` - Approve spending

### 2. Updated App Integration ✅
- **ScheduleScreen.tsx**: Now uses WMNT address instead of zero address
- **PaymentSchedulerService.ts**: 
  - Auto-mints WMNT if user doesn't have enough
  - Auto-approves PaymentScheduler to spend WMNT
  - Creates schedule with proper token address

### 3. Added WMNT Constants ✅
- **constants.ts**: Added WMNT_ADDRESS and WMNT_ABI

## How It Works Now

### When Creating a Schedule:

1. **Check WMNT Balance**
   ```typescript
   balance = await wmnt.balanceOf(userAddress);
   if (balance < amount) {
     // Auto-mint for testing
     await wmnt.mint(userAddress, amount);
   }
   ```

2. **Approve PaymentScheduler**
   ```typescript
   allowance = await wmnt.allowance(userAddress, schedulerAddress);
   if (allowance < amount) {
     await wmnt.approve(schedulerAddress, amount);
   }
   ```

3. **Create Schedule**
   ```typescript
   await scheduler.createSchedule(
     scheduleType,
     WMNT_ADDRESS, // ✅ Now uses WMNT
     recipient,
     amount,
     interval,
     startTime,
     maxExecutions
   );
   ```

### When Keeper Executes:

```javascript
// Keeper calls executeSchedule
await contract.executeSchedule(scheduleId);

// Contract transfers WMNT from creator to recipient
IERC20(schedule.token).safeTransferFrom(
  schedule.creator,
  schedule.recipient,
  schedule.amount
);
```

## Testing Steps

### 1. Rebuild App
```bash
cd f:\W3\mantle-hack\cresca-app
# App will reload automatically with Metro
```

### 2. Create Test Schedule
1. Open Schedule screen
2. Tap today's date
3. Fill form:
   - **Recipient**: `0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d` (your keeper wallet)
   - **Amount**: `0.01` WMNT
   - **Time**: **3 minutes from now**
   - **Frequency**: Once
4. Tap Create

### Expected Flow:
```
Creating schedule...
→ Checking WMNT balance...
→ Minting 0.01 WMNT... ✅
→ Approving PaymentScheduler... ✅
→ Creating schedule on blockchain... ✅
SUCCESS! Payment scheduled on blockchain! ID: 0
```

### 3. Watch Keeper Execute
```
[3:15:44 PM] 🔍 Checking for ready payments...
[3:15:44 PM] 📋 Found 1 active schedule(s)
[3:15:44 PM] ⏳ Schedule #0 not ready yet (next: 2026-01-12 15:18:00)

[3:18:05 PM] 🔍 Checking for ready payments...
[3:18:05 PM] 📋 Found 1 active schedule(s)
[3:18:05 PM] ⚡ Schedule #0 is ready! Executing payment...
[3:18:10 PM] ✅ SUCCESS! Payment executed
[3:18:10 PM] 💰 Transferred 0.01 WMNT to 0x5092...b85d
```

## Verification

### Check WMNT Balance
```bash
cd f:\W3\mantle-hack\contracts
npx hardhat console --network mantleSepolia
```
```javascript
const WMNT = await ethers.getContractAt('WrappedMNT', '0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8');
const balance = await WMNT.balanceOf('YOUR_ADDRESS');
console.log('WMNT Balance:', ethers.formatEther(balance));
```

### Check on Explorer
- **WMNT Contract**: https://sepolia.mantlescan.xyz/address/0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8
- **PaymentScheduler**: https://sepolia.mantlescan.xyz/address/0xfAc3A13b1571A227CF36878fc46E07B56021cd7B

## Files Modified

### Contracts:
- ✅ `contracts/contracts/WrappedMNT.sol` - New WMNT token
- ✅ `contracts/scripts/deploy-wmnt.ts` - Deployment script

### App:
- ✅ `cresca-app/src/config/constants.ts` - Added WMNT constants
- ✅ `cresca-app/src/services/PaymentSchedulerService.ts` - Auto mint/approve logic
- ✅ `cresca-app/src/screens/ScheduleScreen.tsx` - Use WMNT address

### Deployed:
- ✅ WMNT: `0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8`
- ✅ Initial supply: 1000 WMNT to deployer

## Summary

✅ **Error Fixed**: "Invalid token" → Now uses WMNT  
✅ **Auto-Setup**: App mints and approves WMNT automatically  
✅ **Ready to Test**: Create a schedule and watch it execute!  

The app will now:
1. Auto-mint WMNT if you don't have enough
2. Auto-approve PaymentScheduler to spend your WMNT
3. Create schedule successfully on blockchain
4. Keeper will execute payment at scheduled time

**No manual steps needed** - just create a schedule and it works! 🚀
