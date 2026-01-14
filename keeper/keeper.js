/**
 * Payment Scheduler Keeper Service
 * Automatically executes scheduled payments when they're ready
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;
const PAYMENT_SCHEDULER_ADDRESS = process.env.PAYMENT_SCHEDULER_ADDRESS || '0xYourPaymentSchedulerAddress';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60000; // 60 seconds
const GAS_LIMIT = 300000; // Default gas limit
const MAX_SCHEDULES_TO_CHECK = 100; // Limit schedules checked per cycle

// PaymentScheduler ABI
const PAYMENT_SCHEDULER_ABI = [
  'function executeSchedule(uint256 scheduleId)',
  'function isScheduleReady(uint256 scheduleId) view returns (bool)',
  'function getActiveSchedules() view returns (uint256[])',
  'function getSchedule(uint256 scheduleId) view returns (tuple(uint256 id, address creator, uint8 scheduleType, uint8 status, address token, address recipient, uint256 amount, uint256 interval, uint256 startTime, uint256 endTime, uint256 lastExecuted, uint256 executionCount, uint256 maxExecutions))',
  'function isKeeper(address) view returns (bool)',
  'event ScheduleExecuted(uint256 indexed scheduleId, uint256 timestamp, uint256 amount)',
  'event ScheduleCompleted(uint256 indexed scheduleId)',
];

class PaymentKeeperService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isRunning = false;
    this.executionCount = 0;
    this.failureCount = 0;
  }

  /**
   * Initialize the keeper service
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Payment Keeper Service...\n');

      // Validate configuration
      if (!PRIVATE_KEY) {
        throw new Error('KEEPER_PRIVATE_KEY not set in environment variables');
      }

      if (!PAYMENT_SCHEDULER_ADDRESS || PAYMENT_SCHEDULER_ADDRESS.includes('Your')) {
        throw new Error('PAYMENT_SCHEDULER_ADDRESS not configured');
      }

      // Setup provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      console.log(`📡 Connected to RPC: ${RPC_URL}`);

      // Setup wallet
      this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
      console.log(`👤 Keeper Address: ${this.wallet.address}`);

      // Check balance
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`💰 Keeper Balance: ${ethers.formatEther(balance)} MNT`);

      if (balance === 0n) {
        console.warn('⚠️  WARNING: Keeper has 0 balance! Add MNT to execute transactions.');
      }

      // Setup contract
      this.contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        this.wallet
      );
      console.log(`📝 Contract Address: ${PAYMENT_SCHEDULER_ADDRESS}`);

      // Verify keeper authorization
      const isKeeper = await this.contract.isKeeper(this.wallet.address);
      if (!isKeeper) {
        console.error('❌ ERROR: This address is not authorized as a keeper!');
        console.error('   Run: contract.addKeeper("' + this.wallet.address + '") as contract owner');
        process.exit(1);
      }

      console.log('✅ Keeper is authorized!\n');
      console.log('═'.repeat(60));
      console.log(`⏰ Check Interval: ${CHECK_INTERVAL / 1000} seconds`);
      console.log('═'.repeat(60));
      console.log('');

      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Check and execute ready schedules
   */
  async checkAndExecute() {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] 🔍 Checking for ready payments...`);

    try {
      // Get total number of schedules by checking recent IDs
      // More efficient than calling getActiveSchedules which loops twice
      let maxScheduleId = 0;
      try {
        // Try to get schedule at increasing IDs until we hit a non-existent one
        for (let i = 0; i < MAX_SCHEDULES_TO_CHECK; i++) {
          try {
            await this.contract.getSchedule(i);
            maxScheduleId = i;
          } catch {
            break; // No more schedules
          }
        }
      } catch (error) {
        console.log(`[${timestamp}] ℹ️  No schedules found\n`);
        return;
      }

      if (maxScheduleId === 0) {
        console.log(`[${timestamp}] ℹ️  No schedules found\n`);
        return;
      }

      console.log(`[${timestamp}] 📋 Checking schedules 0-${maxScheduleId}`);

      // Check each schedule
      let readyCount = 0;
      let executedCount = 0;
      let activeCount = 0;

      for (let scheduleId = 0; scheduleId <= maxScheduleId; scheduleId++) {
        try {
          // Get schedule first to check status
          const schedule = await this.contract.getSchedule(scheduleId);
          
          // Only check active schedules (status 0 = ACTIVE)
          if (schedule.status !== 0) {
            continue;
          }
          
          activeCount++;
          
          // Check if ready
          const isReady = await this.contract.isScheduleReady(scheduleId);
          
          if (isReady) {
            readyCount++;
            
            console.log(`[${timestamp}] ⚡ Schedule #${scheduleId} is ready!`);
            console.log(`   💸 Amount: ${ethers.formatEther(schedule.amount)} MNT`);
            console.log(`   👤 Recipient: ${schedule.recipient}`);
            console.log(`   🔄 Execution: ${schedule.executionCount}/${schedule.maxExecutions || '∞'}`);

            // Execute the schedule
            await this.executeSchedule(scheduleId, schedule);
            executedCount++;
          }
        } catch (error) {
          // Skip non-existent schedules silently
          if (!error.message.includes('call revert exception')) {
            console.error(`[${timestamp}] ⚠️  Error checking schedule #${scheduleId}:`, error.message);
          }
        }
      }

      console.log(`[${timestamp}] 📊 Active: ${activeCount}, Ready: ${readyCount}, Executed: ${executedCount}\n`);

      console.log(`[${timestamp}] 📊 Active: ${activeCount}, Ready: ${readyCount}, Executed: ${executedCount}\n`);

    } catch (error) {
      console.error(`[${timestamp}] ❌ Error in check cycle:`, error.message);
      this.failureCount++;
    }
  }

  /**
   * Execute a single schedule
   */
  async executeSchedule(scheduleId, schedule) {
    const timestamp = new Date().toLocaleString();
    
    try {
      console.log(`[${timestamp}] 🔄 Executing schedule #${scheduleId}...`);

      // Estimate gas with better handling
      let gasLimit = GAS_LIMIT;
      try {
        const gasEstimate = await this.contract.executeSchedule.estimateGas(scheduleId);
        gasLimit = Math.floor(Number(gasEstimate) * 1.5); // 50% buffer for safety
        console.log(`[${timestamp}] ⛽ Estimated gas: ${gasLimit.toLocaleString()}`);
      } catch (error) {
        console.log(`[${timestamp}] ⚠️  Gas estimation failed, using default: ${GAS_LIMIT}`);
        console.log(`[${timestamp}]    Reason: ${error.message.substring(0, 100)}`);
      }

      // Execute transaction
      const tx = await this.contract.executeSchedule(scheduleId, {
        gasLimit: gasLimit,
      });

      console.log(`[${timestamp}] 📤 Transaction sent: ${tx.hash}`);
      console.log(`[${timestamp}] ⏳ Waiting for confirmation...`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        this.executionCount++;
        console.log(`[${timestamp}] ✅ SUCCESS! Schedule #${scheduleId} executed`);
        console.log(`[${timestamp}] 🧾 Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`[${timestamp}] 🔗 Block: ${receipt.blockNumber}`);
        console.log(`[${timestamp}] 💰 Paid: ${ethers.formatEther(schedule.amount)} MNT to ${schedule.recipient.slice(0, 8)}...`);
        
        // Check if schedule was completed
        const updatedSchedule = await this.contract.getSchedule(scheduleId);
        if (updatedSchedule.status === 3) { // COMPLETED
          console.log(`[${timestamp}] 🎉 Schedule #${scheduleId} marked as COMPLETED`);
        }
      } else {
        this.failureCount++;
        console.error(`[${timestamp}] ❌ Transaction failed for schedule #${scheduleId}`);
      }

    } catch (error) {
      this.failureCount++;
      console.error(`[${timestamp}] ❌ Failed to execute schedule #${scheduleId}:`, error.message);
      
      // Parse specific error messages
      if (error.message.includes('Interval not met')) {
        console.error(`[${timestamp}] ⏰ Interval requirement not yet met`);
      } else if (error.message.includes('Schedule not active')) {
        console.error(`[${timestamp}] 🚫 Schedule is no longer active`);
      } else if (error.message.includes('insufficient funds')) {
        console.error(`[${timestamp}] 💸 Keeper has insufficient funds for gas!`);
      }
    }
  }

  /**
   * Start the keeper service
   */
  async start() {
    await this.initialize();

    console.log('🟢 Keeper service started!\n');
    console.log('Press Ctrl+C to stop\n');

    // Initial check
    await this.checkAndExecute();

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.checkAndExecute();
    }, CHECK_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop the keeper service
   */
  stop() {
    console.log('\n\n🛑 Stopping keeper service...');
    console.log('═'.repeat(60));
    console.log(`📊 Final Statistics:`);
    console.log(`   ✅ Successful executions: ${this.executionCount}`);
    console.log(`   ❌ Failed attempts: ${this.failureCount}`);
    console.log('═'.repeat(60));
    console.log('👋 Goodbye!\n');

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.isRunning = false;
    process.exit(0);
  }

  /**
   * Display service status
   */
  getStatus() {
    return {
      running: this.isRunning,
      executionCount: this.executionCount,
      failureCount: this.failureCount,
      keeperAddress: this.wallet?.address,
      contractAddress: PAYMENT_SCHEDULER_ADDRESS,
    };
  }
}

// Main execution
if (require.main === module) {
  const keeper = new PaymentKeeperService();
  
  keeper.start().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = PaymentKeeperService;
