import { ethers } from 'ethers';
import WalletService from './WalletService';
import { MANTLE_SEPOLIA, WMNT_ADDRESS, WMNT_ABI } from '../config/constants';

const PAYMENT_SCHEDULER_ADDRESS = '0xfAc3A13b1571A227CF36878fc46E07B56021cd7B';

// Minimal ABI for PaymentScheduler contract
const PAYMENT_SCHEDULER_ABI = [
  'function createSchedule(uint8 scheduleType, address token, address recipient, uint256 amount, uint256 interval, uint256 startTime, uint256 maxExecutions) returns (uint256)',
  'function executeSchedule(uint256 scheduleId)',
  'function pauseSchedule(uint256 scheduleId)',
  'function resumeSchedule(uint256 scheduleId)',
  'function cancelSchedule(uint256 scheduleId)',
  'function isScheduleReady(uint256 scheduleId) view returns (bool)',
  'function getUserSchedules(address user) view returns (uint256[])',
  'function getSchedule(uint256 scheduleId) view returns (tuple(uint256 id, address creator, uint8 scheduleType, uint8 status, address token, address recipient, uint256 amount, uint256 interval, uint256 startTime, uint256 endTime, uint256 lastExecuted, uint256 executionCount, uint256 maxExecutions))',
  'function getActiveSchedules() view returns (uint256[])',
  'event ScheduleCreated(uint256 indexed scheduleId, address indexed creator, uint8 scheduleType, address token, address recipient, uint256 amount)',
  'event ScheduleExecuted(uint256 indexed scheduleId, uint256 timestamp, uint256 amount)',
  'event ScheduleCompleted(uint256 indexed scheduleId)',
];

export enum ScheduleType {
  ONE_TIME = 0,
  RECURRING = 1,
  DCA = 2,
}

export enum ScheduleStatus {
  ACTIVE = 0,
  PAUSED = 1,
  CANCELLED = 2,
  COMPLETED = 3,
}

export interface Schedule {
  id: string;
  creator: string;
  scheduleType: ScheduleType;
  status: ScheduleStatus;
  token: string;
  recipient: string;
  amount: string;
  interval: number;
  startTime: Date;
  endTime?: Date;
  lastExecuted?: Date;
  executionCount: number;
  maxExecutions: number;
  isReady: boolean;
}

class PaymentSchedulerService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;

  private async getProvider() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
    }
    return this.provider;
  }

  private async getContract() {
    if (!this.contract) {
      const provider = await this.getProvider();
      this.contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        provider
      );
    }
    return this.contract;
  }

  /**
   * Ensure user has WMNT and has approved the scheduler
   */
  async ensureWMNTApproval(amount: string): Promise<void> {
    await WalletService.loadWallet();
    const signer = WalletService.getWallet();
    const wmnt = new ethers.Contract(WMNT_ADDRESS, WMNT_ABI, signer);
    const userAddress = await signer.getAddress();

    const amountWei = ethers.parseEther(amount);

    // Check balance
    const balance = await wmnt.balanceOf(userAddress);
    if (balance < amountWei) {
      // Mint enough WMNT for testing
      console.log(`Minting ${amount} WMNT...`);
      const mintTx = await wmnt.mint(userAddress, amountWei);
      await mintTx.wait();
      console.log('✅ WMNT minted');
    }

    // Check and approve if needed
    const allowance = await wmnt.allowance(userAddress, PAYMENT_SCHEDULER_ADDRESS);
    if (allowance < amountWei) {
      console.log(`Approving PaymentScheduler to spend ${amount} WMNT...`);
      const approveTx = await wmnt.approve(PAYMENT_SCHEDULER_ADDRESS, amountWei);
      await approveTx.wait();
      console.log('✅ WMNT approved');
    }
  }

  /**
   * Create a new scheduled payment
   */
  async createSchedule(
    scheduleType: ScheduleType,
    token: string,
    recipient: string,
    amount: string,
    interval: number,
    startTime: Date,
    maxExecutions: number = 0
  ): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();

      // Ensure WMNT approval before creating schedule
      if (token === WMNT_ADDRESS) {
        await this.ensureWMNTApproval(amount);
      }

      const contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);
      
      // Add 2-minute buffer to ensure timestamp is in the future when tx is mined
      // This accounts for transaction delays, network congestion, and mint/approve time
      const startTimestamp = Math.floor(startTime.getTime() / 1000) + 120;
      
      console.log('Creating schedule with start time:', new Date(startTimestamp * 1000).toLocaleString());

      const tx = await contract.createSchedule(
        scheduleType,
        token,
        recipient,
        amountWei,
        interval,
        startTimestamp,
        maxExecutions
      );

      const receipt = await tx.wait();
      
      // Get schedule ID from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed?.name === 'ScheduleCreated');

      const scheduleId = event?.args?.scheduleId?.toString() || '0';
      
      console.log(`Schedule created with ID: ${scheduleId}`);
      return scheduleId;
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('Start time in past')) {
        throw new Error('Schedule time has passed. Please select a time at least 3 minutes in the future.');
      } else if (error.message?.includes('Invalid token')) {
        throw new Error('Invalid token address. Please contact support.');
      } else if (error.message?.includes('Insufficient balance')) {
        throw new Error('Insufficient WMNT balance. The app will mint tokens automatically on next attempt.');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction cancelled by user.');
      }
      
      throw new Error(error.message || 'Failed to create schedule. Please try again.');
    }
  }

  /**
   * Execute a scheduled payment manually (if ready)
   */
  async executeSchedule(scheduleId: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      const contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );

      // Check if ready first
      const ready = await contract.isScheduleReady(scheduleId);
      if (!ready) {
        throw new Error('Schedule is not ready for execution yet');
      }

      const tx = await contract.executeSchedule(scheduleId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error executing schedule:', error);
      throw new Error(error.message || 'Failed to execute schedule');
    }
  }

  /**
   * Get all schedules for the current user
   */
  async getUserSchedules(): Promise<Schedule[]> {
    try {
      const contract = await this.getContract();
      const userAddress = await WalletService.getAddress();
      
      const scheduleIds = await contract.getUserSchedules(userAddress);
      const schedules: Schedule[] = [];

      for (const id of scheduleIds) {
        try {
          const scheduleData = await contract.getSchedule(id);
          const isReady = await contract.isScheduleReady(id);

          schedules.push({
            id: id.toString(),
            creator: scheduleData.creator,
            scheduleType: scheduleData.scheduleType,
            status: scheduleData.status,
            token: scheduleData.token,
            recipient: scheduleData.recipient,
            amount: ethers.formatEther(scheduleData.amount),
            interval: Number(scheduleData.interval),
            startTime: new Date(Number(scheduleData.startTime) * 1000),
            endTime: scheduleData.endTime > 0 ? new Date(Number(scheduleData.endTime) * 1000) : undefined,
            lastExecuted: scheduleData.lastExecuted > 0 ? new Date(Number(scheduleData.lastExecuted) * 1000) : undefined,
            executionCount: Number(scheduleData.executionCount),
            maxExecutions: Number(scheduleData.maxExecutions),
            isReady,
          });
        } catch (error) {
          console.error(`Error fetching schedule ${id}:`, error);
        }
      }

      return schedules;
    } catch (error) {
      console.error('Error getting user schedules:', error);
      return [];
    }
  }

  /**
   * Pause a schedule
   */
  async pauseSchedule(scheduleId: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      const contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );

      const tx = await contract.pauseSchedule(scheduleId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error pausing schedule:', error);
      throw new Error(error.message || 'Failed to pause schedule');
    }
  }

  /**
   * Resume a paused schedule
   */
  async resumeSchedule(scheduleId: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      const contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );

      const tx = await contract.resumeSchedule(scheduleId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error resuming schedule:', error);
      throw new Error(error.message || 'Failed to resume schedule');
    }
  }

  /**
   * Cancel a schedule
   */
  async cancelSchedule(scheduleId: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      const contract = new ethers.Contract(
        PAYMENT_SCHEDULER_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );

      const tx = await contract.cancelSchedule(scheduleId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error cancelling schedule:', error);
      throw new Error(error.message || 'Failed to cancel schedule');
    }
  }

  /**
   * Get schedule status text
   */
  getStatusText(status: ScheduleStatus): string {
    switch (status) {
      case ScheduleStatus.ACTIVE:
        return 'ACTIVE';
      case ScheduleStatus.PAUSED:
        return 'PAUSED';
      case ScheduleStatus.CANCELLED:
        return 'CANCELLED';
      case ScheduleStatus.COMPLETED:
        return 'COMPLETED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get schedule type text
   */
  getTypeText(type: ScheduleType): string {
    switch (type) {
      case ScheduleType.ONE_TIME:
        return 'ONCE';
      case ScheduleType.RECURRING:
        return 'RECURRING';
      case ScheduleType.DCA:
        return 'DCA';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Calculate next execution time
   */
  getNextExecutionTime(schedule: Schedule): Date | null {
    if (schedule.status !== ScheduleStatus.ACTIVE) return null;
    if (schedule.maxExecutions > 0 && schedule.executionCount >= schedule.maxExecutions) return null;

    if (schedule.scheduleType === ScheduleType.ONE_TIME) {
      return schedule.executionCount === 0 ? schedule.startTime : null;
    }

    if (schedule.lastExecuted) {
      return new Date(schedule.lastExecuted.getTime() + schedule.interval * 1000);
    }

    return schedule.startTime;
  }
}

export default new PaymentSchedulerService();
