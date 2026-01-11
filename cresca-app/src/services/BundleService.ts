import { ethers } from 'ethers';
import WalletService from './WalletService';
import { MANTLE_SEPOLIA } from '../config/constants';

const BUNDLE_FACTORY_ADDRESS = '0xB463bf41250c9f83A846708fa96fB20aC1B4f08E';
const VAULT_MANAGER_ADDRESS = '0x12d06098124c6c24E0551c429D996c8958A32083';

// Minimal ABI for BundleFactory contract
const BUNDLE_FACTORY_ABI = [
  'function allBundles(uint256) view returns (address)',
  'function bundles(address) view returns (address bundleToken, address[] tokens, uint256[] weights, address creator, uint256 createdAt, string name, string symbol, bool isActive)',
  'function createBundle(address[] tokens, uint256[] weights, string name, string symbol) returns (address)',
  'function investInBundle(address bundleToken, uint256 amount) payable',
  'function getAllBundles() view returns (address[])',
  'function getUserInvestment(address bundleToken, address user) view returns (uint256)',
];

// Minimal ABI for BundleToken
const BUNDLE_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function getTokens() view returns (address[])',
  'function getWeights() view returns (uint256[])',
];

export interface Bundle {
  id: string;
  address: string;
  name: string;
  symbol: string;
  apy: string;
  tvl: string;
  tokens: string[];
  weights: number[];
  composition: string;
  creator: address;
  isActive: boolean;
  userInvestment?: string;
}

class BundleService {
  private provider: ethers.JsonRpcProvider | null = null;
  private bundleFactoryContract: ethers.Contract | null = null;

  private async getProvider() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
    }
    return this.provider;
  }

  private async getBundleFactoryContract() {
    if (!this.bundleFactoryContract) {
      const provider = await this.getProvider();
      this.bundleFactoryContract = new ethers.Contract(
        BUNDLE_FACTORY_ADDRESS,
        BUNDLE_FACTORY_ABI,
        provider
      );
    }
    return this.bundleFactoryContract;
  }

  /**
   * Get all available bundles from the contract
   */
  async getAllBundles(): Promise<Bundle[]> {
    try {
      const contract = await this.getBundleFactoryContract();
      const provider = await this.getProvider();
      
      // Get all bundle addresses
      const bundleAddresses: string[] = [];
      let index = 0;
      
      try {
        while (true) {
          const bundleAddress = await contract.allBundles(index);
          if (bundleAddress === ethers.ZeroAddress) break;
          bundleAddresses.push(bundleAddress);
          index++;
        }
      } catch (error) {
        // End of array reached
      }

      // Fetch details for each bundle
      const bundles: Bundle[] = [];
      
      for (const bundleAddress of bundleAddresses) {
        try {
          const bundleInfo = await contract.bundles(bundleAddress);
          
          if (!bundleInfo.isActive) continue;

          // Get token details
          const bundleTokenContract = new ethers.Contract(
            bundleAddress,
            BUNDLE_TOKEN_ABI,
            provider
          );

          const totalSupply = await bundleTokenContract.totalSupply();
          const tvl = ethers.formatEther(totalSupply);

          // Format composition string
          const composition = this.formatComposition(
            bundleInfo.tokens,
            bundleInfo.weights
          );

          // Calculate estimated APY (mock for now, could be calculated from historical data)
          const apy = this.calculateEstimatedAPY(bundleInfo.weights);

          bundles.push({
            id: bundleAddress,
            address: bundleAddress,
            name: bundleInfo.name,
            symbol: bundleInfo.symbol,
            apy: apy,
            tvl: parseFloat(tvl).toFixed(2),
            tokens: bundleInfo.tokens,
            weights: bundleInfo.weights.map((w: bigint) => Number(w) / 100),
            composition: composition,
            creator: bundleInfo.creator,
            isActive: bundleInfo.isActive,
          });
        } catch (error) {
          console.error(`Error fetching bundle ${bundleAddress}:`, error);
        }
      }

      return bundles;
    } catch (error) {
      console.error('Error getting all bundles:', error);
      return [];
    }
  }

  /**
   * Get user's investment in a specific bundle
   */
  async getUserInvestment(bundleAddress: string): Promise<string> {
    try {
      const contract = await this.getBundleFactoryContract();
      const userAddress = await WalletService.getAddress();
      
      const investment = await contract.getUserInvestment(bundleAddress, userAddress);
      return ethers.formatEther(investment);
    } catch (error) {
      console.error('Error getting user investment:', error);
      return '0';
    }
  }

  /**
   * Get user's active investments across all bundles
   */
  async getUserInvestments(): Promise<Bundle[]> {
    try {
      const allBundles = await this.getAllBundles();
      const userAddress = await WalletService.getAddress();
      const contract = await this.getBundleFactoryContract();

      const userInvestments: Bundle[] = [];

      for (const bundle of allBundles) {
        try {
          const investment = await contract.getUserInvestment(bundle.address, userAddress);
          const investmentAmount = ethers.formatEther(investment);

          if (parseFloat(investmentAmount) > 0) {
            userInvestments.push({
              ...bundle,
              userInvestment: investmentAmount,
            });
          }
        } catch (error) {
          console.error(`Error checking investment in ${bundle.address}:`, error);
        }
      }

      return userInvestments;
    } catch (error) {
      console.error('Error getting user investments:', error);
      return [];
    }
  }

  /**
   * Invest in a bundle
   */
  async investInBundle(bundleAddress: string, amount: string): Promise<string> {
    try {
      const signer = await WalletService.getSigner();
      const contract = new ethers.Contract(
        BUNDLE_FACTORY_ADDRESS,
        BUNDLE_FACTORY_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);

      const tx = await contract.investInBundle(bundleAddress, amountWei, {
        value: amountWei,
      });

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error investing in bundle:', error);
      throw new Error(error.message || 'Failed to invest in bundle');
    }
  }

  /**
   * Create a new bundle
   */
  async createBundle(
    tokens: string[],
    weights: number[],
    name: string,
    symbol: string
  ): Promise<string> {
    try {
      const signer = await WalletService.getSigner();
      const contract = new ethers.Contract(
        BUNDLE_FACTORY_ADDRESS,
        BUNDLE_FACTORY_ABI,
        signer
      );

      // Convert weights to contract format (multiply by 100 for precision)
      const contractWeights = weights.map((w) => Math.round(w * 100));

      const tx = await contract.createBundle(tokens, contractWeights, name, symbol);
      await tx.wait();

      return tx.hash;
    } catch (error: any) {
      console.error('Error creating bundle:', error);
      throw new Error(error.message || 'Failed to create bundle');
    }
  }

  /**
   * Format composition string from tokens and weights
   */
  private formatComposition(tokens: string[], weights: bigint[]): string {
    const tokenSymbols = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']; // Mock symbols
    
    const parts = tokens.map((token, index) => {
      const weight = Number(weights[index]) / 100;
      const symbol = tokenSymbols[index % tokenSymbols.length];
      return `${symbol} ${weight}%`;
    });

    return parts.join(' • ');
  }

  /**
   * Calculate estimated APY based on weights (simplified calculation)
   */
  private calculateEstimatedAPY(weights: bigint[]): string {
    // Mock APY calculation - in production, this would use historical data
    const baseAPY = 8.5;
    const volatilityFactor = weights.length * 1.2;
    const estimatedAPY = baseAPY + (volatilityFactor - 8);
    
    return Math.max(5, Math.min(20, estimatedAPY)).toFixed(1);
  }
}

export default new BundleService();
