import 'react-native-get-random-values';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import { MANTLE_SEPOLIA } from '../config/constants';

const PRIVATE_KEY = 'user_private_key';

class WalletService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;

  private getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      try {
        this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl, undefined, {
          staticNetwork: true,
        });
      } catch (error) {
        console.error('Provider initialization error:', error);
        this.provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz', undefined, {
          staticNetwork: true,
        });
      }
    }
    return this.provider;
  }

  async createWallet(): Promise<{ address: string; privateKey: string; mnemonic: string }> {
    const wallet = ethers.Wallet.createRandom();
    await SecureStore.setItemAsync(PRIVATE_KEY, wallet.privateKey);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || '',
    };
  }

  async importWallet(privateKey: string): Promise<string> {
    const provider = this.getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    this.wallet = wallet;
    await SecureStore.setItemAsync(PRIVATE_KEY, privateKey);
    return wallet.address;
  }

  async hasWallet(): Promise<boolean> {
    const key = await SecureStore.getItemAsync(PRIVATE_KEY);
    return key !== null;
  }

  async loadWallet(): Promise<ethers.Wallet> {
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    
    if (!privateKey) {
      throw new Error('No wallet found');
    }

    const provider = this.getProvider();
    this.wallet = new ethers.Wallet(privateKey, provider);
    return this.wallet;
  }

  async getAddress(): Promise<string> {
    if (!this.wallet) {
      await this.loadWallet();
    }
    return this.wallet!.address;
  }

  async getBalance(): Promise<string> {
    if (!this.wallet) {
      await this.loadWallet();
    }
    const provider = this.getProvider();
    const balance = await provider.getBalance(this.wallet!.address);
    return ethers.formatEther(balance);
  }

  async deleteWallet(): Promise<void> {
    await SecureStore.deleteItemAsync(PRIVATE_KEY);
    this.wallet = null;
  }

  getProviderInstance(): ethers.JsonRpcProvider {
    return this.getProvider();
  }

  getWallet(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not loaded');
    }
    return this.wallet;
  }
}

// Export both as named and default
export const walletService = new WalletService();
export default walletService;
