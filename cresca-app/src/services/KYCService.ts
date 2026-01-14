import { ethers } from 'ethers';
import WalletService from './WalletService';
import { MANTLE_SEPOLIA } from '../config/constants';
import { KYCTier } from './RWAService';

// KYC Registry deployed address
const KYC_REGISTRY_ADDRESS = '0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB';

// Admin wallet for demo verification (your deployer address)
const ADMIN_PRIVATE_KEY = process.env.EXPO_PUBLIC_ADMIN_PRIVATE_KEY || '';

// KYC Registry ABI
const KYC_REGISTRY_ABI = [
  'function verifyKYC(address user, uint8 tier, string jurisdiction, uint256 validityDays, bool isAccredited, bytes32 documentHash, string providerName)',
  'function isVerified(address user) view returns (bool)',
  'function getKYCStatus(address user) view returns (uint8 tier, uint256 verificationDate, uint256 expirationDate, string jurisdiction, bool isActive, bool isAccredited)',
  'function updateKYCTier(address user, uint8 newTier)',
  'function updateAccreditationStatus(address user, bool isAccredited)',
];

export interface VerificationRequest {
  userAddress: string;
  tier: KYCTier;
  jurisdiction: string;
  isAccredited: boolean;
}

class KYCService {
  private provider: ethers.JsonRpcProvider | null = null;
  private adminWallet: ethers.Wallet | null = null;

  private async getProvider() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
    }
    return this.provider;
  }

  private async getAdminWallet() {
    if (!this.adminWallet && ADMIN_PRIVATE_KEY) {
      const provider = await this.getProvider();
      this.adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    }
    return this.adminWallet;
  }

  /**
   * Verify user's KYC (Demo mode - instant verification)
   * In production, this would be called by a backend after real KYC provider verification
   */
  async verifyUserKYC(request: VerificationRequest): Promise<string> {
    try {
      console.log('Starting KYC verification for:', request.userAddress);
      
      // For demo: Use admin wallet to verify
      // In production: Backend service would call this
      const adminWallet = await this.getAdminWallet();
      
      if (!adminWallet) {
        // Fallback: Use user's own wallet (self-verification for demo)
        await WalletService.loadWallet();
        const signer = WalletService.getWallet();
        
        const contract = new ethers.Contract(
          KYC_REGISTRY_ADDRESS,
          KYC_REGISTRY_ABI,
          signer
        );
        
        // Note: This will fail if user doesn't have KYC_PROVIDER_ROLE
        // For demo purposes, we'll catch and show friendly message
        try {
          const tx = await contract.verifyKYC(
            request.userAddress,
            request.tier,
            request.jurisdiction,
            365, // Valid for 1 year
            request.isAccredited,
            ethers.keccak256(ethers.toUtf8Bytes(request.userAddress)), // Mock document hash
            'Cresca-Demo'
          );
          
          await tx.wait();
          return tx.hash;
        } catch (error: any) {
          if (error.message.includes('AccessControl')) {
            // User doesn't have permission - provide helpful message
            throw new Error(
              'Demo Mode: KYC verification requires admin approval. ' +
              'In production, this would be handled by a KYC provider backend service.'
            );
          }
          throw error;
        }
      }
      
      // Admin wallet verification (proper demo flow)
      const contract = new ethers.Contract(
        KYC_REGISTRY_ADDRESS,
        KYC_REGISTRY_ABI,
        adminWallet
      );
      
      const tx = await contract.verifyKYC(
        request.userAddress,
        request.tier,
        request.jurisdiction,
        365, // Valid for 1 year
        request.isAccredited,
        ethers.keccak256(ethers.toUtf8Bytes(request.userAddress)), // Mock document hash
        'Cresca-Demo'
      );
      
      console.log('KYC verification transaction sent:', tx.hash);
      await tx.wait();
      console.log('KYC verification confirmed!');
      
      return tx.hash;
    } catch (error: any) {
      console.error('Error verifying KYC:', error);
      throw new Error(error.message || 'Failed to verify KYC');
    }
  }

  /**
   * Check if user is verified
   */
  async isUserVerified(userAddress?: string): Promise<boolean> {
    try {
      const provider = await this.getProvider();
      const contract = new ethers.Contract(
        KYC_REGISTRY_ADDRESS,
        KYC_REGISTRY_ABI,
        provider
      );
      
      const address = userAddress || (await WalletService.loadWallet().then(() => WalletService.getWallet().getAddress()));
      
      return await contract.isVerified(address);
    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  }

  /**
   * Get user's KYC status
   */
  async getKYCStatus(userAddress?: string) {
    try {
      const provider = await this.getProvider();
      const contract = new ethers.Contract(
        KYC_REGISTRY_ADDRESS,
        KYC_REGISTRY_ABI,
        provider
      );
      
      const address = userAddress || (await WalletService.loadWallet().then(() => WalletService.getWallet().getAddress()));
      
      const [tier, verificationDate, expirationDate, jurisdiction, isActive, isAccredited] = 
        await contract.getKYCStatus(address);
      
      return {
        tier: Number(tier) as KYCTier,
        verificationDate: new Date(Number(verificationDate) * 1000),
        expirationDate: new Date(Number(expirationDate) * 1000),
        jurisdiction,
        isActive,
        isAccredited,
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  }

  /**
   * Get supported jurisdictions (hardcoded for demo)
   */
  getSupportedJurisdictions(): Array<{ code: string; name: string }> {
    return [
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'SG', name: 'Singapore' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'JP', name: 'Japan' },
      { code: 'AU', name: 'Australia' },
      { code: 'CA', name: 'Canada' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'NL', name: 'Netherlands' },
    ];
  }

  /**
   * Get KYC tier information
   */
  getTierInfo(tier: KYCTier): {
    name: string;
    description: string;
    badge: string;
    benefits: string[];
  } {
    switch (tier) {
      case KYCTier.BASIC:
        return {
          name: 'Basic',
          description: 'Identity verification',
          badge: '✅',
          benefits: [
            'Invest up to $10,000 per asset',
            'Access to low-risk RWA products',
            'Standard processing times',
          ],
        };
      case KYCTier.INTERMEDIATE:
        return {
          name: 'Intermediate',
          description: 'Enhanced verification',
          badge: '✅✅',
          benefits: [
            'Invest up to $100,000 per asset',
            'Access to real estate & bonds',
            'Priority support',
            'Lower fees',
          ],
        };
      case KYCTier.ADVANCED:
        return {
          name: 'Advanced',
          description: 'Accredited investor',
          badge: '✅✅✅',
          benefits: [
            'Unlimited investment amounts',
            'Access to all RWA products',
            'Private deal access',
            'Lowest fees',
            'Dedicated account manager',
          ],
        };
      default:
        return {
          name: 'Not Verified',
          description: 'Complete verification to invest',
          badge: '❌',
          benefits: ['Browse RWA assets only'],
        };
    }
  }
}

export default new KYCService();
