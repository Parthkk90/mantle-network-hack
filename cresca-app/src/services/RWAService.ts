import { ethers } from 'ethers';
import WalletService from './WalletService';
import { MANTLE_SEPOLIA } from '../config/constants';

// Deployed contract addresses from DEPLOYMENT_SUMMARY.md
const KYC_REGISTRY_ADDRESS = '0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB';
const RWA_VAULT_ADDRESS = '0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63';
const RWA_TOKEN_ADDRESS = '0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC';
const YIELD_DISTRIBUTOR_ADDRESS = '0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844';

// KYC Registry ABI
const KYC_REGISTRY_ABI = [
  'function isVerified(address user) view returns (bool)',
  'function getKYCStatus(address user) view returns (uint8 tier, uint256 verificationDate, uint256 expirationDate, string jurisdiction, bool isActive, bool isAccredited)',
  'function meetsKYCTier(address user, uint8 requiredTier) view returns (bool)',
  'function canInvestFromJurisdiction(address user, uint256 amount) view returns (bool)',
];

// RWA Token ABI
const RWA_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function assetDetails() view returns (uint8 assetType, string assetIdentifier, uint256 totalValue, uint256 acquisitionDate, string legalDocumentHash, string valuationReportHash, bool isVerified)',
  'function getYieldHistory() view returns (tuple(uint256 totalAmount, uint256 distributionDate, uint256 perTokenAmount, string description)[])',
  'function claimableYield(address holder) view returns (uint256)',
  'function claimYield()',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Yield Distributor ABI
const YIELD_DISTRIBUTOR_ABI = [
  'function distributions(uint256) view returns (address rwaToken, address paymentToken, uint256 totalAmount, uint256 createdAt, uint256 claimDeadline, uint256 totalClaimed, bool isActive, string description)',
  'function getClaimableAmount(uint256 distributionId, address holder) view returns (uint256 grossAmount, uint256 netAmount, uint256 taxAmount)',
  'function claimYield(uint256 distributionId)',
  'function getUserDistributions(address user) view returns (uint256[])',
];

// RWA Vault ABI
const RWA_VAULT_ABI = [
  'function getAssetBalance(address token) view returns (uint256)',
  'function depositAsset(address token, uint256 amount, string description)',
  'function requestWithdrawal(address token, address recipient, uint256 amount, string description) returns (uint256)',
];

export enum KYCTier {
  NONE = 0,
  BASIC = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
}

export enum AssetType {
  REAL_ESTATE = 0,
  BOND = 1,
  INVOICE = 2,
  CASH_FLOW_RIGHTS = 3,
  OTHER = 4,
}

export interface RWAAsset {
  address: string;
  name: string;
  symbol: string;
  assetType: AssetType;
  assetIdentifier: string;
  totalValue: string;
  totalSupply: string;
  isVerified: boolean;
  userBalance: string;
  claimableYield: string;
}

export interface KYCStatus {
  isVerified: boolean;
  tier: KYCTier;
  jurisdiction: string;
  expirationDate: Date;
  isAccredited: boolean;
}

export interface YieldDistribution {
  id: string;
  amount: string;
  date: Date;
  description: string;
  claimable: string;
  claimed: boolean;
}

class RWAService {
  private provider: ethers.JsonRpcProvider | null = null;
  private kycContract: ethers.Contract | null = null;

  private async getProvider() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
    }
    return this.provider;
  }

  private async getKYCContract() {
    if (!this.kycContract) {
      const provider = await this.getProvider();
      this.kycContract = new ethers.Contract(
        KYC_REGISTRY_ADDRESS,
        KYC_REGISTRY_ABI,
        provider
      );
    }
    return this.kycContract;
  }

  /**
   * Check if user is KYC verified
   */
  async isUserVerified(userAddress?: string): Promise<boolean> {
    try {
      const contract = await this.getKYCContract();
      const address = userAddress || (await WalletService.loadWallet().then(() => WalletService.getWallet().getAddress()));
      
      return await contract.isVerified(address);
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  /**
   * Get user's KYC status details
   */
  async getKYCStatus(userAddress?: string): Promise<KYCStatus | null> {
    try {
      const contract = await this.getKYCContract();
      const address = userAddress || (await WalletService.loadWallet().then(() => WalletService.getWallet().getAddress()));
      
      const [tier, verificationDate, expirationDate, jurisdiction, isActive, isAccredited] = 
        await contract.getKYCStatus(address);
      
      return {
        isVerified: isActive,
        tier: Number(tier) as KYCTier,
        jurisdiction,
        expirationDate: new Date(Number(expirationDate) * 1000),
        isAccredited,
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  }

  /**
   * Get RWA token details
   */
  async getRWAAsset(tokenAddress: string): Promise<RWAAsset | null> {
    try {
      const provider = await this.getProvider();
      const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, provider);
      
      await WalletService.loadWallet();
      const userAddress = await WalletService.getWallet().getAddress();
      
      const [name, symbol, totalSupply, userBalance, assetDetails, claimableYield] = await Promise.all([
        token.name(),
        token.symbol(),
        token.totalSupply(),
        token.balanceOf(userAddress),
        token.assetDetails(),
        token.claimableYield(userAddress),
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        assetType: Number(assetDetails[0]) as AssetType,
        assetIdentifier: assetDetails[1],
        totalValue: ethers.formatUnits(assetDetails[2], 6), // USD cents
        totalSupply: ethers.formatEther(totalSupply),
        isVerified: assetDetails[6],
        userBalance: ethers.formatEther(userBalance),
        claimableYield: ethers.formatEther(claimableYield),
      };
    } catch (error) {
      console.error('Error getting RWA asset:', error);
      return null;
    }
  }

  /**
   * Get user's yield distributions
   */
  async getUserYieldDistributions(userAddress?: string): Promise<YieldDistribution[]> {
    try {
      const provider = await this.getProvider();
      const distributor = new ethers.Contract(
        YIELD_DISTRIBUTOR_ADDRESS,
        YIELD_DISTRIBUTOR_ABI,
        provider
      );
      
      const address = userAddress || (await WalletService.loadWallet().then(() => WalletService.getWallet().getAddress()));
      
      const distributionIds = await distributor.getUserDistributions(address);
      const distributions: YieldDistribution[] = [];
      
      for (const id of distributionIds) {
        const dist = await distributor.distributions(id);
        const [grossAmount] = await distributor.getClaimableAmount(id, address);
        
        distributions.push({
          id: id.toString(),
          amount: ethers.formatEther(dist.totalAmount),
          date: new Date(Number(dist.createdAt) * 1000),
          description: dist.description,
          claimable: ethers.formatEther(grossAmount),
          claimed: grossAmount === 0n,
        });
      }
      
      return distributions;
    } catch (error) {
      console.error('Error getting yield distributions:', error);
      return [];
    }
  }

  /**
   * Claim yield from RWA token
   */
  async claimYield(tokenAddress: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      
      const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, signer);
      
      const tx = await token.claimYield();
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error claiming yield:', error);
      throw new Error(error.message || 'Failed to claim yield');
    }
  }

  /**
   * Claim yield from distribution
   */
  async claimDistributionYield(distributionId: string): Promise<string> {
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      
      const distributor = new ethers.Contract(
        YIELD_DISTRIBUTOR_ADDRESS,
        YIELD_DISTRIBUTOR_ABI,
        signer
      );
      
      const tx = await distributor.claimYield(distributionId);
      await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error claiming distribution yield:', error);
      throw new Error(error.message || 'Failed to claim yield');
    }
  }

  /**
   * Get asset type display name
   */
  getAssetTypeName(assetType: AssetType): string {
    switch (assetType) {
      case AssetType.REAL_ESTATE:
        return 'Real Estate';
      case AssetType.BOND:
        return 'Bond';
      case AssetType.INVOICE:
        return 'Invoice';
      case AssetType.CASH_FLOW_RIGHTS:
        return 'Cash Flow Rights';
      default:
        return 'Other';
    }
  }

  /**
   * Get KYC tier display name
   */
  getKYCTierName(tier: KYCTier): string {
    switch (tier) {
      case KYCTier.NONE:
        return 'Not Verified';
      case KYCTier.BASIC:
        return 'Basic';
      case KYCTier.INTERMEDIATE:
        return 'Intermediate';
      case KYCTier.ADVANCED:
        return 'Advanced';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get KYC tier badge emoji
   */
  getKYCTierBadge(tier: KYCTier): string {
    switch (tier) {
      case KYCTier.NONE:
        return '❌';
      case KYCTier.BASIC:
        return '✅';
      case KYCTier.INTERMEDIATE:
        return '✅✅';
      case KYCTier.ADVANCED:
        return '✅✅✅';
      default:
        return '❓';
    }
  }
}

export default new RWAService();
