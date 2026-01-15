import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import RWAService, { RWAAsset, YieldDistribution } from '../services/RWAService';
import WalletService from '../services/WalletService';
import { RWAScreenSkeleton } from '../components/RWAScreenSkeleton';
import { ethers } from 'ethers';

const { width } = Dimensions.get('window');

// Enhanced RWA Vault types
interface RWAVault {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedYield: number;
  grossYield: number;
  hedgingCost: number;
  riskScore: 'A+' | 'A' | 'B+' | 'B' | 'C';
  riskLevel: 'High' | 'Medium' | 'Low';
  protection: 'Insurance' | 'Collateral' | 'Sovereign' | 'Mixed' | 'FX' | 'None';
  lockPeriod: number; // days
  filledAmount: number;
  capAmount: number;
  status: 'Trending' | 'Stable' | 'Hot' | 'Safe' | 'New' | 'Sold Out';
  isActive: boolean;
  underlyingAssets: UnderlyingAsset[];
  image?: string;
}

interface UnderlyingAsset {
  id: string;
  name: string;
  type: string;
  issuer: string;
  ltvRatio: number;
  maturityDate: string;
  assetClass: string;
  apy: number;
  value: number;
  risk: 'Low' | 'Medium' | 'High';
}

export default function RWAScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [yields, setYields] = useState<YieldDistribution[]>([]);
  const [userAddress, setUserAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories for filtering
  const categories = ['All', 'Real Estate', 'Bonds', 'Invoice', 'Mixed', 'Equity'];

  // Enhanced RWA Vaults with detailed information matching the reference
  const rwaVaults: RWAVault[] = [
    {
      id: '1',
      name: 'Prime Real Estate',
      category: 'REAL ESTATE',
      description: 'Fractionalized debt position backed by Class A office space in Manhattan.',
      expectedYield: 8.2,
      grossYield: 10.2,
      hedgingCost: 2,
      riskScore: 'A+',
      riskLevel: 'High',
      protection: 'Insurance',
      lockPeriod: 90,
      filledAmount: 12500000,
      capAmount: 15000000,
      status: 'Trending',
      isActive: true,
      underlyingAssets: [
        {
          id: 'RWA-8829-X',
          name: '155 Bishopsgate Commercial Office',
          type: 'Commercial Real Estate',
          issuer: 'Hudson Yards Capital',
          ltvRatio: 65,
          maturityDate: 'Dec 2028',
          assetClass: 'Commercial Real Estate',
          apy: 12.5,
          value: 145200000,
          risk: 'Low',
        },
        {
          id: 'RWA-7742-Y',
          name: 'One World Trade Center Office Space',
          type: 'Commercial Real Estate',
          issuer: 'Hudson Yards Capital',
          ltvRatio: 65,
          maturityDate: 'Dec 2030',
          assetClass: 'Commercial Real Estate',
          apy: 9.8,
          value: 220000000,
          risk: 'Low',
        },
      ],
    },
    {
      id: '2',
      name: 'Corp Bond Yield',
      category: 'BOND',
      description: 'Investment grade corporate bonds from Fortune 500 companies.',
      expectedYield: 5.5,
      grossYield: 6.5,
      hedgingCost: 1,
      riskScore: 'A',
      riskLevel: 'Medium',
      protection: 'Collateral',
      lockPeriod: 30,
      filledAmount: 4500000,
      capAmount: 10000000,
      status: 'Stable',
      isActive: true,
      underlyingAssets: [
        {
          id: 'BOND-4521-A',
          name: 'Apple Inc. Corporate Bonds',
          type: 'Corporate Bond',
          issuer: 'Apple Inc.',
          ltvRatio: 80,
          maturityDate: 'Jun 2027',
          assetClass: 'Investment Grade',
          apy: 5.2,
          value: 50000000,
          risk: 'Low',
        },
      ],
    },
    {
      id: '3',
      name: 'Invoice Alpha',
      category: 'INVOICE',
      description: 'High-yield invoice factoring from verified enterprise clients.',
      expectedYield: 12.4,
      grossYield: 15.4,
      hedgingCost: 3,
      riskScore: 'B+',
      riskLevel: 'High',
      protection: 'Collateral',
      lockPeriod: 180,
      filledAmount: 2800000,
      capAmount: 3000000,
      status: 'Hot',
      isActive: true,
      underlyingAssets: [
        {
          id: 'INV-9981-Z',
          name: 'Enterprise Tech Invoices Q1',
          type: 'Invoice Factoring',
          issuer: 'FinTech Capital',
          ltvRatio: 75,
          maturityDate: 'Mar 2026',
          assetClass: 'Invoice Factoring',
          apy: 14.2,
          value: 3500000,
          risk: 'Medium',
        },
      ],
    },
    {
      id: '4',
      name: 'Treasury Bill',
      category: 'GOV BOND',
      description: 'US Government Treasury Bills with sovereign guarantee.',
      expectedYield: 4.8,
      grossYield: 4.8,
      hedgingCost: 0,
      riskScore: 'A+',
      riskLevel: 'Low',
      protection: 'Sovereign',
      lockPeriod: 0,
      filledAmount: 48000000,
      capAmount: 50000000,
      status: 'Safe',
      isActive: true,
      underlyingAssets: [
        {
          id: 'TBILL-2026-Q1',
          name: 'US Treasury 6-Month Bill',
          type: 'Government Bond',
          issuer: 'US Treasury',
          ltvRatio: 100,
          maturityDate: 'Jun 2026',
          assetClass: 'Government Bond',
          apy: 4.8,
          value: 100000000,
          risk: 'Low',
        },
      ],
    },
    {
      id: '5',
      name: 'Diversified Pool',
      category: 'MIXED',
      description: 'Balanced portfolio of real estate, bonds, and yield-generating assets.',
      expectedYield: 7.1,
      grossYield: 8.6,
      hedgingCost: 1.5,
      riskScore: 'A',
      riskLevel: 'High',
      protection: 'Mixed',
      lockPeriod: 60,
      filledAmount: 8000000,
      capAmount: 15000000,
      status: 'New',
      isActive: true,
      underlyingAssets: [
        {
          id: 'MIX-1122-A',
          name: 'Multi-Asset Growth Fund',
          type: 'Mixed Assets',
          issuer: 'Cresca Capital',
          ltvRatio: 70,
          maturityDate: 'Dec 2027',
          assetClass: 'Diversified',
          apy: 7.5,
          value: 25000000,
          risk: 'Medium',
        },
      ],
    },
    {
      id: '6',
      name: 'Emerging Infra',
      category: 'EQUITY',
      description: 'Infrastructure equity in emerging markets with high growth potential.',
      expectedYield: 15.8,
      grossYield: 18.8,
      hedgingCost: 3,
      riskScore: 'B',
      riskLevel: 'Low',
      protection: 'FX',
      lockPeriod: 365,
      filledAmount: 5000000,
      capAmount: 5000000,
      status: 'Sold Out',
      isActive: false,
      underlyingAssets: [
        {
          id: 'INFRA-7788-X',
          name: 'Southeast Asia Infrastructure Fund',
          type: 'Infrastructure Equity',
          issuer: 'Global Infra Partners',
          ltvRatio: 55,
          maturityDate: 'Dec 2029',
          assetClass: 'Equity',
          apy: 16.5,
          value: 80000000,
          risk: 'High',
        },
      ],
    },
  ];

  // Demo RWA assets (in production, fetch from contracts)
  const demoAssets = [
    {
      tokenId: '1',
      name: 'Manhattan Office Building',
      assetType: 0, // Real Estate
      totalValue: '5000000', // $5M
      tokenizedValue: '2500000', // $2.5M tokenized
      yieldRate: 800, // 8%
      isActive: true,
      lastYieldDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      tokenId: '2',
      name: 'US Treasury Bonds 2025',
      assetType: 1, // Bonds
      totalValue: '10000000', // $10M
      tokenizedValue: '8000000', // $8M tokenized
      yieldRate: 450, // 4.5%
      isActive: true,
      lastYieldDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      tokenId: '3',
      name: 'Corporate Invoice Portfolio',
      assetType: 2, // Invoices
      totalValue: '500000', // $500K
      tokenizedValue: '500000', // Fully tokenized
      yieldRate: 650, // 6.5%
      isActive: true,
      lastYieldDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await WalletService.loadWallet();
      const address = await WalletService.getWallet().getAddress();
      setUserAddress(address);

      // Check KYC status
      const verified = await RWAService.isUserVerified(address);
      setIsVerified(verified);

      if (verified) {
        const status = await RWAService.getKYCStatus(address);
        setKycStatus(status);

        // Load yield distributions
        const distributions = await RWAService.getUserYieldDistributions(address);
        setYields(distributions);
      }
    } catch (error) {
      console.error('Error loading RWA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleVerifyKYC = () => {
    navigation.navigate('KYCVerification');
  };

  const handleClaimYield = async (distribution: YieldDistribution) => {
    Alert.alert(
      'Claim Yield',
      `Claim ${parseFloat(distribution.amount).toFixed(4)} MNT from ${distribution.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              setLoading(true);
              const txHash = await RWAService.claimDistributionYield(distribution.id);
              Alert.alert(
                'Yield Claimed!',
                `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
              );
              await handleRefresh();
            } catch (error: any) {
              Alert.alert('Claim Failed', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return `$${num.toLocaleString()}`;
  };

  const formatYieldRate = (rate: number) => {
    return `${(rate / 100).toFixed(2)}%`;
  };

  // Helper functions for vault display
  const getStatusColor = (status: RWAVault['status']) => {
    // Unified color for all status badges
    return COLORS.text;
  };

  const getRiskIcon = (level: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'High': 'shield-checkmark',
      'Medium': 'shield-half',
      'Low': 'warning',
    };
    return icons[level] || 'shield';
  };

  const getProtectionIcon = (protection: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Insurance': 'checkmark',
      'Collateral': 'link',
      'Sovereign': 'star',
      'Mixed': 'git-merge',
      'FX': 'alert-circle',
      'None': 'close',
    };
    return icons[protection] || 'shield';
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  const filteredVaults = selectedCategory === 'All' 
    ? rwaVaults 
    : rwaVaults.filter(v => v.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  // Show shimmer skeleton during initial load
  if (loading && !refreshing) {
    return <RWAScreenSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Real World Assets</Text>
          <Text style={styles.subtitle}>Tokenized investments</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Total RWA Value</Text>
          <Text style={styles.summaryValue}>$0.00</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>Claimable Yield</Text>
          <Text style={styles.yieldValue}>
            {yields.reduce((sum, y) => sum + parseFloat(ethers.formatEther(y.amount)), 0).toFixed(4)} MNT
          </Text>
        </View>
      </View>

      {/* KYC Status Card */}
      <View style={[styles.kycCard, isVerified && styles.kycCardVerified]}>
        <View style={styles.kycHeader}>
          <View style={styles.kycLeft}>
            <Text style={styles.kycTitle}>KYC Status</Text>
            {isVerified && kycStatus ? (
              <View style={styles.kycStatusRow}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <Text style={styles.kycTier}>{RWAService.getKYCTierName(kycStatus.tier)}</Text>
              </View>
            ) : (
              <Text style={styles.kycSubtitle}>Complete verification to invest</Text>
            )}
          </View>
          {isVerified && kycStatus && (
            <View style={styles.tierBadge}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            </View>
          )}
        </View>

        {isVerified && kycStatus ? (
          <View style={styles.kycDetails}>
            <View style={styles.kycJurisdictionRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.kycJurisdiction}>{kycStatus.jurisdiction}</Text>
            </View>
            {kycStatus.isAccredited && (
              <View style={styles.accreditedBadge}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.accreditedText}>Accredited Investor</Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyKYC}>
            <Text style={styles.verifyButtonText}>Verify Identity</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textWhite} />
          </TouchableOpacity>
        )}
      </View>

      {/* Claimable Yields Section */}
      {isVerified && yields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claimable Yields</Text>
          {yields.map((distribution, index) => (
            <View key={index} style={styles.yieldCard}>
              <View style={styles.yieldHeader}>
                <View style={styles.yieldIconContainer}>
                  <Ionicons name="cash-outline" size={24} color={COLORS.success} />
                </View>
                <View style={styles.yieldInfo}>
                  <Text style={styles.yieldAsset}>{distribution.description}</Text>
                  <Text style={styles.yieldDate}>
                    {distribution.date.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.yieldAmountContainer}>
                  <Text style={styles.yieldAmount}>
                    +{parseFloat(distribution.amount).toFixed(4)}
                  </Text>
                  <Text style={styles.yieldCurrency}>MNT</Text>
                </View>
              </View>

              {!distribution.claimed ? (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaimYield(distribution)}
                >
                  <Text style={styles.claimButtonText}>Claim Yield</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.claimedBadge}>
                  <Ionicons name="checkmark" size={14} color={COLORS.success} />
                  <Text style={styles.claimedText}>Claimed</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* RWA Vaults */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Investment Vaults</Text>
          <Text style={styles.sectionCount}>{filteredVaults.length} vaults</Text>
        </View>

        {filteredVaults.map((vault) => {
          const fillPercentage = (vault.filledAmount / vault.capAmount) * 100;
          const statusColor = getStatusColor(vault.status);
          
          return (
            <TouchableOpacity
              key={vault.id}
              style={[
                styles.vaultCard,
                !vault.isActive && styles.vaultCardDisabled,
              ]}
              onPress={() => vault.isActive && navigation.navigate('RWAInvestment', { vault })}
              activeOpacity={vault.isActive ? 0.7 : 1}
            >
              {/* Vault Header */}
              <View style={styles.vaultHeader}>
                <View style={styles.vaultImageContainer}>
                  <View style={styles.vaultImagePlaceholder}>
                    <Ionicons name="business" size={22} color={COLORS.primary} />
                  </View>
                </View>
                <View style={styles.vaultHeaderInfo}>
                  <View style={styles.vaultTitleRow}>
                    <Text style={styles.vaultName}>{vault.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{vault.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.vaultCategory}>{vault.category}</Text>
                </View>
              </View>

              {/* Yield Info */}
              <View style={styles.yieldRow}>
                <View>
                  <Text style={styles.yieldPercent}>{vault.expectedYield}%</Text>
                  <Text style={styles.yieldLabel}>Expected Yield</Text>
                </View>
                <TouchableOpacity style={styles.yieldHistoryBtn}>
                  <Text style={styles.yieldHistoryText}>View Yield History</Text>
                </TouchableOpacity>
              </View>

              {/* Risk/Protection Info */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Ionicons name={getRiskIcon(vault.riskLevel)} size={14} color={COLORS.primary} />
                  <Text style={styles.metricLabel}>{vault.riskLevel}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name={getProtectionIcon(vault.protection)} size={14} color={COLORS.primary} />
                  <Text style={styles.metricLabel}>{vault.protection}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
                  <Text style={styles.metricLabel}>{vault.lockPeriod} Days</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {formatLargeNumber(vault.filledAmount)} / {formatLargeNumber(vault.capAmount)} Filled
                  </Text>
                  <Text style={styles.progressPercent}>{fillPercentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(fillPercentage, 100)}%` },
                      fillPercentage >= 90 && styles.progressFillHigh,
                    ]} 
                  />
                </View>
              </View>

              {/* Action Button */}
              {vault.isActive ? (
                <TouchableOpacity 
                  style={styles.viewVaultButton}
                  onPress={() => navigation.navigate('RWAInvestment', { vault })}
                >
                  <Text style={styles.viewVaultText}>View Vault</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.soldOutButton}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  <Text style={styles.soldOutText}>Sold Out</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Yield Breakdown Info Card */}
      <View style={styles.yieldBreakdownCard}>
        <Text style={styles.breakdownTitle}>How Yield Works</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>GROSS YIELD</Text>
          <Text style={styles.breakdownValue}>10%</Text>
          <Text style={styles.breakdownNote}>Asset Performance</Text>
        </View>
        <View style={styles.breakdownDivider}>
          <Text style={styles.breakdownOperator}>−</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>HEDGING COST</Text>
          <Text style={[styles.breakdownValue, { color: '#FF6B6B' }]}>-2%</Text>
          <Text style={styles.breakdownNote}>Option Premium</Text>
        </View>
        <View style={styles.breakdownDivider}>
          <Text style={styles.breakdownOperator}>=</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: COLORS.success }]}>NET YIELD</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.success }]}>8%</Text>
          <Text style={styles.breakdownNote}>User Profit</Text>
        </View>
      </View>

      {/* Security Features */}
      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>Security & Compliance</Text>
        <View style={styles.securityFeatures}>
          <View style={styles.securityItem}>
            <View style={styles.securityIconBg}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.securityItemTitle}>Insurance Fund</Text>
              <Text style={styles.securityItemDesc}>Additional $2M coverage</Text>
            </View>
          </View>
          <View style={styles.securityItem}>
            <View style={styles.securityIconBg}>
              <Ionicons name="document-text" size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.securityItemTitle}>Smart Contracts</Text>
              <Text style={styles.securityItemDesc}>Audited by Certik</Text>
            </View>
          </View>
          <View style={styles.securityItem}>
            <View style={styles.securityIconBg}>
              <Ionicons name="checkmark-done" size={16} color={COLORS.warning} />
            </View>
            <View>
              <Text style={styles.securityItemTitle}>KYC/AML</Text>
              <Text style={styles.securityItemDesc}>Fully compliant</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryLeft: {},
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  yieldValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  kycCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kycCardVerified: {
    borderColor: COLORS.accentGreen,
    borderWidth: 2,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kycLeft: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  kycSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  kycStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentGreen + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentGreen,
  },
  kycTier: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kycDetails: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycJurisdictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kycJurisdiction: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  accreditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accreditedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },
  verifyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyArrow: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  yieldCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accentGreen + '40',
  },
  yieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  yieldIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accentGreen + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yieldIcon: {
    fontSize: 22,
  },
  yieldInfo: {
    flex: 1,
    marginLeft: 12,
  },
  yieldAsset: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  yieldDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  yieldAmountContainer: {
    alignItems: 'flex-end',
  },
  yieldAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  yieldCurrency: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  claimButton: {
    padding: 12,
    backgroundColor: COLORS.accentGreen,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: COLORS.accentGreen + '15',
    borderRadius: 12,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accentGreen,
  },
  assetCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assetCardDisabled: {
    opacity: 0.6,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIcon: {
    fontSize: 24,
  },
  assetHeaderLeft: {
    flex: 1,
    marginLeft: 12,
  },
  assetType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  assetYieldBadge: {
    backgroundColor: COLORS.accentGreen + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  assetYieldRate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  assetYieldLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  assetDetails: {
    gap: 10,
    marginBottom: 16,
  },
  assetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetDetailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  assetDetailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  investButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    gap: 8,
  },
  investButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  investArrow: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  lockedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.textMuted + '15',
    borderRadius: 12,
    gap: 8,
  },
  lockedIcon: {
    fontSize: 16,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  infoFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  // Category Filter Styles
  categoryContainer: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  // Vault Card Styles
  vaultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vaultCardDisabled: {
    opacity: 0.6,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vaultImageContainer: {
    marginRight: 10,
  },
  vaultImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultHeaderInfo: {
    flex: 1,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  vaultName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vaultCategory: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  yieldPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
  },
  yieldLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  yieldHistoryBtn: {
    paddingVertical: 2,
  },
  yieldHistoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressFillHigh: {
    backgroundColor: COLORS.warning,
  },
  viewVaultButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewVaultText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  soldOutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.textMuted + '15',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  soldOutText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  // Yield Breakdown Card
  yieldBreakdownCard: {
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 85,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    width: 50,
  },
  breakdownNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
  },
  breakdownDivider: {
    paddingLeft: 85,
    paddingVertical: 2,
  },
  breakdownOperator: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  // Security Card
  securityCard: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  securityFeatures: {
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  securityItemDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bottomSpacer: {
    height: 100,
  },
});
