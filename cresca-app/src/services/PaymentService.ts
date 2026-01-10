import { ethers } from 'ethers';
import WalletService from './WalletService';
import { PAYMENT_PROCESSOR_ADDRESS, PAYMENT_PROCESSOR_ABI, ERC20_ABI } from '../config/constants';

interface SendMNTParams {
  recipient: string;
  amount: string;
  note: string;
}

interface SendTokenParams {
  tokenAddress: string;
  recipient: string;
  amount: string;
  note: string;
}

interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  paymentId?: string;
  error?: string;
}

interface Payment {
  id: string;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  timestamp: Date;
  note: string;
  type: number;
}

class PaymentService {
  private async getContract(): Promise<ethers.Contract> {
    const wallet = WalletService.getWallet();
    return new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_PROCESSOR_ABI, wallet);
  }

  async sendMNT(params: SendMNTParams): Promise<PaymentResult> {
    try {
      if (!ethers.isAddress(params.recipient)) {
        throw new Error('Invalid recipient address');
      }

      const contract = await this.getContract();
      const amountWei = ethers.parseEther(params.amount);

      const tx = await contract.sendMNT(params.recipient, params.note, {
        value: amountWei,
      });

      const receipt = await tx.wait();
      const paymentId = receipt.logs[0]?.topics[1] || '0';

      return {
        success: true,
        transactionHash: receipt.hash,
        paymentId: paymentId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  async sendToken(params: SendTokenParams): Promise<PaymentResult> {
    try {
      if (!ethers.isAddress(params.recipient)) {
        throw new Error('Invalid recipient address');
      }
      if (!ethers.isAddress(params.tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const wallet = WalletService.getWallet();
      const contract = await this.getContract();
      const tokenContract = new ethers.Contract(params.tokenAddress, ERC20_ABI, wallet);

      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(params.amount, decimals);

      const allowance = await tokenContract.allowance(wallet.address, PAYMENT_PROCESSOR_ADDRESS);

      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(PAYMENT_PROCESSOR_ADDRESS, amountWei);
        await approveTx.wait();
      }

      const tx = await contract.sendToken(
        params.tokenAddress,
        params.recipient,
        amountWei,
        params.note
      );

      const receipt = await tx.wait();
      const paymentId = receipt.logs[receipt.logs.length - 1]?.topics[1] || '0';

      return {
        success: true,
        transactionHash: receipt.hash,
        paymentId: paymentId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  async getPaymentHistory(userAddress: string): Promise<{ sent: Payment[]; received: Payment[] }> {
    try {
      const contract = await this.getContract();

      const sentIds = await contract.getUserSentPayments(userAddress);
      const receivedIds = await contract.getUserReceivedPayments(userAddress);

      const sent = await Promise.all(
        sentIds.map(async (id: bigint) => {
          const payment = await contract.payments(id);
          return {
            id: id.toString(),
            sender: payment.sender,
            recipient: payment.recipient,
            token: payment.token,
            amount:
              payment.token === ethers.ZeroAddress
                ? ethers.formatEther(payment.amount)
                : ethers.formatUnits(payment.amount, 18),
            timestamp: new Date(Number(payment.timestamp) * 1000),
            note: payment.note,
            type: payment.paymentType,
          };
        })
      );

      const received = await Promise.all(
        receivedIds.map(async (id: bigint) => {
          const payment = await contract.payments(id);
          return {
            id: id.toString(),
            sender: payment.sender,
            recipient: payment.recipient,
            token: payment.token,
            amount:
              payment.token === ethers.ZeroAddress
                ? ethers.formatEther(payment.amount)
                : ethers.formatUnits(payment.amount, 18),
            timestamp: new Date(Number(payment.timestamp) * 1000),
            note: payment.note,
            type: payment.paymentType,
          };
        })
      );

      return { sent, received };
    } catch (error: any) {
      console.error('Payment history error:', error);
      return { sent: [], received: [] };
    }
  }
}

export default new PaymentService();
