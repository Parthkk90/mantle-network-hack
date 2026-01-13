import { ethers } from 'ethers';
import WalletService from './WalletService';
import { MANTLE_SEPOLIA } from '../config/constants';

const BUNDLE_FACTORY_ADDRESS = '0xd218F93Fd6adE12E7C89F20172aC976ec79bcbA9';
const VAULT_MANAGER_ADDRESS = '0x4A4A9Ae6f059334794A9200fB19E3780d17b587C';

// Minimal ABI for BundleFactory contract
const BUNDLE_FACTORY_ABI = [
  'function allBundles(uint256) view returns (address)',
  'function bundles(address) view returns (address bundleToken, address[] tokens, uint256[] weights, address creator, uint256 createdAt, string name, string symbol, bool isActive)',
  'function createBundle(address[] tokens, uint256[] weights, string name, string symbol) returns (address)',
  'function investInBundle(address bundleToken, uint256 amount) payable',
  'function getAllBundles() view returns (address[])',
  'function getUserInvestment(address bundleToken, address user) view returns (uint256)',
  'function withdrawFromBundle(address bundleToken, uint256 amount)',
  'event Investment(address indexed bundleToken, address indexed user, uint256 amount)',
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
  creator: string;
  isActive: boolean;
  userInvestment?: string;
  leverage?: number;
  position?: 'long' | 'short';
  isMock?: boolean;
}

class BundleService {
  private provider: ethers.JsonRpcProvider | null = null;
  private bundleFactoryContract: ethers.Contract | null = null;
  private usingMockBundles: boolean = false;

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
      
      // Get all bundle addresses using getAllBundles() view function
      let bundleAddresses: string[] = [];
      
      try {
        bundleAddresses = await contract.getAllBundles();
        console.log('Bundle addresses from contract:', bundleAddresses);
      } catch (error) {
        console.log('No bundles found on contract, using mock data');
        // Return mock bundles if contract call fails
        this.usingMockBundles = true;
        return this.getMockBundles();
      }

      // If no bundles exist yet, return mock bundles
      if (bundleAddresses.length === 0) {
        console.log('No bundles on chain, returning mock bundles');
        this.usingMockBundles = true;
        return this.getMockBundles();
      }
      
      this.usingMockBundles = false;

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
      
      // If using mock bundles, return empty array (no real investments)
      if (this.usingMockBundles) {
        console.log('Using mock bundles - no real investments to check');
        return [];
      }
      
      const userAddress = await WalletService.getAddress();
      const contract = await this.getBundleFactoryContract();

      const userInvestments: Bundle[] = [];

      for (const bundle of allBundles) {
        // Skip mock bundles (they don't exist on chain)
        if (bundle.isMock) {
          continue;
        }
        
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
  async investInBundle(bundleAddress: string, amount: string, leverage: number = 1, position: 'long' | 'short' = 'long'): Promise<string> {
    try {
      console.log('Investing in bundle:', {
        bundleAddress,
        amount,
        leverage,
        position,
      });

      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      const userAddress = await signer.getAddress();
      
      console.log('User address:', userAddress);
      console.log('Factory address:', BUNDLE_FACTORY_ADDRESS);

      const contract = new ethers.Contract(
        BUNDLE_FACTORY_ADDRESS,
        BUNDLE_FACTORY_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);
      console.log('Amount in wei:', amountWei.toString());

      // Check if bundle exists
      const allBundles = await contract.getAllBundles();
      console.log('All bundles:', allBundles);
      
      if (!allBundles.includes(bundleAddress)) {
        throw new Error('Bundle does not exist on chain. Please select a real bundle (not a mock).');
      }

      console.log('Calling investInBundle...');
      const tx = await contract.investInBundle(bundleAddress, amountWei, {
        value: amountWei,
      });

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      
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
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
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

  /**
   * Get mock bundles for testing (when no bundles exist on chain)
   */
  private getMockBundles(): Bundle[] {
    return [
      {
        id: '0x1',
        address: '0x0000000000000000000000000000000000000001',
        name: 'Balanced Growth',
        symbol: 'GROW',
        apy: '12.5',
        tvl: '125000.00',
        tokens: ['0xMNT', '0xWMNT', '0xUSDC'],
        weights: [40, 35, 25],
        composition: 'MNT 40% • WMNT 35% • USDC 25%',
        creator: '0x0',
        isActive: true,
        leverage: 1,
        position: 'long',
        isMock: true,
      },
      {
        id: '0x2',
        address: '0x0000000000000000000000000000000000000002',
        name: 'Stable Income',
        symbol: 'STBL',
        apy: '8.2',
        tvl: '250000.00',
        tokens: ['0xUSDC', '0xUSDT', '0xMNT'],
        weights: [50, 30, 20],
        composition: 'USDC 50% • USDT 30% • MNT 20%',
        creator: '0x0',
        isActive: true,
        leverage: 1,
        position: 'long',
        isMock: true,
      },
      {
        id: '0x3',
        address: '0x0000000000000000000000000000000000000003',
        name: 'DeFi Blue Chip',
        symbol: 'BLUE',
        apy: '15.8',
        tvl: '180000.00',
        tokens: ['0xWETH', '0xWBTC', '0xMNT', '0xUSDC'],
        weights: [30, 30, 25, 15],
        composition: 'WETH 30% • WBTC 30% • MNT 25% • USDC 15%',
        creator: '0x0',
        isActive: true,
        leverage: 2,
        position: 'long',
        isMock: true,
      },
      {
        id: '0x4',
        address: '0x0000000000000000000000000000000000000004',
        name: 'High Yield Aggressive',
        symbol: 'HYAG',
        apy: '22.4',
        tvl: '95000.00',
        tokens: ['0xMNT', '0xWETH', '0xWBTC'],
        weights: [50, 30, 20],
        composition: 'MNT 50% • WETH 30% • WBTC 20%',
        creator: '0x0',
        isActive: true,
        leverage: 3,
        position: 'long',
        isMock: true,
      },
      {
        id: '0x5',
        address: '0x0000000000000000000000000000000000000005',
        name: 'Mantle Maximizer',
        symbol: 'MMAX',
        apy: '18.7',
        tvl: '310000.00',
        tokens: ['0xMNT', '0xWMNT'],
        weights: [60, 40],
        composition: 'MNT 60% • WMNT 40%',
        creator: '0x0',
        isActive: true,
        leverage: 2,
        position: 'long',
        isMock: true,
      },
      {
        id: '0x6',
        address: '0x0000000000000000000000000000000000000006',
        name: 'Conservative Shield',
        symbol: 'SHLD',
        apy: '6.5',
        tvl: '420000.00',
        tokens: ['0xUSDC', '0xUSDT'],
        weights: [60, 40],
        composition: 'USDC 60% • USDT 40%',
        creator: '0x0',
        isActive: true,
        leverage: 1,
        position: 'long',
        isMock: true,
      },
    ];
  }
}

export default new BundleService();
