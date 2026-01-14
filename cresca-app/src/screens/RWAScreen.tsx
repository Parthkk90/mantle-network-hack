import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../theme/colors';
import RWAService, { RWAAsset, YieldDistribution } from '../services/RWAService';
import WalletService from '../services/WalletService';
import { ethers } from 'ethers';

export default function RWAScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [yields, setYields] = useState<YieldDistribution[]>([]);
  const [userAddress, setUserAddress] = useState('');

  // Demo RWA assets (in production, fetch from contracts)
  const demoAssets: RWAAsset[] = [
    {
      tokenId: '1',
      name: 'Manhattan Office Building',
      assetType: 0, // Real Estate
      totalValue: ethers.parseEther('5000000'), // $5M
      tokenizedValue: ethers.parseEther('2500000'), // $2.5M tokenized
      yieldRate: 800, // 8%
      isActive: true,
      lastYieldDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      tokenId: '2',
      name: 'US Treasury Bonds 2025',
      assetType: 1, // Bonds
      totalValue: ethers.parseEther('10000000'), // $10M
      tokenizedValue: ethers.parseEther('8000000'), // $8M tokenized
      yieldRate: 450, // 4.5%
      isActive: true,
      lastYieldDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      tokenId: '3',
      name: 'Corporate Invoice Portfolio',
      assetType: 2, // Invoices
      totalValue: ethers.parseEther('500000'), // $500K
      tokenizedValue: ethers.parseEther('500000'), // Fully tokenized
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
      `Claim ${ethers.formatEther(distribution.amount)} MNT from ${distribution.assetName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              setLoading(true);
              const txHash = await RWAService.claimDistributionYield(distribution.distributionId);
              Alert.alert(
                'Yield Claimed! 💰',
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

  const formatCurrency = (wei: bigint) => {
    const eth = ethers.formatEther(wei);
    return `$${parseFloat(eth).toLocaleString()}`;
  };

  const formatYieldRate = (rate: number) => {
    return `${(rate / 100).toFixed(2)}%`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>LOADING_RWA_DATA...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{'>> REAL_WORLD_ASSETS'}</Text>
        <Text style={styles.subtitle}>TOKENIZED_INVESTMENTS</Text>
      </View>

      {/* KYC Status Card */}
      <View style={styles.kycCard}>
        <View style={styles.kycHeader}>
          <Text style={styles.kycTitle}>KYC_STATUS</Text>
          {isVerified && kycStatus && (
            <Text style={styles.kycBadge}>{RWAService.getKYCTierBadge(kycStatus.tier)}</Text>
          )}
        </View>

        {isVerified && kycStatus ? (
          <View>
            <Text style={styles.kycVerified}>✅ VERIFIED</Text>
            <Text style={styles.kycTier}>{RWAService.getKYCTierName(kycStatus.tier)}</Text>
            <Text style={styles.kycJurisdiction}>Jurisdiction: {kycStatus.jurisdiction}</Text>
            {kycStatus.isAccredited && (
              <Text style={styles.accreditedBadge}>⭐ ACCREDITED_INVESTOR</Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.kycNotVerified}>❌ NOT_VERIFIED</Text>
            <Text style={styles.kycDescription}>
              Verify your identity to invest in RWA
            </Text>
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyKYC}>
              <Text style={styles.verifyButtonText}>VERIFY_NOW</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Claimable Yields Section */}
      {isVerified && yields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{'>> CLAIMABLE_YIELDS'}</Text>
          {yields.map((distribution, index) => (
            <View key={index} style={styles.yieldCard}>
              <View style={styles.yieldHeader}>
                <View>
                  <Text style={styles.yieldAsset}>{distribution.assetName}</Text>
                  <Text style={styles.yieldDate}>
                    {distribution.distributionDate.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.yieldAmountContainer}>
                  <Text style={styles.yieldAmount}>
                    {ethers.formatEther(distribution.amount)}
                  </Text>
                  <Text style={styles.yieldCurrency}>MNT</Text>
                </View>
              </View>

              {!distribution.claimed ? (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaimYield(distribution)}
                >
                  <Text style={styles.claimButtonText}>CLAIM_YIELD</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.claimedBadge}>
                  <Text style={styles.claimedText}>✅ CLAIMED</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Available RWA Assets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{'>> AVAILABLE_ASSETS'}</Text>
        <Text style={styles.sectionHint}>
          {isVerified ? 'Investment opportunities' : 'Verify KYC to invest'}
        </Text>

        {demoAssets.map((asset, index) => (
          <View
            key={index}
            style={[
              styles.assetCard,
              !isVerified && styles.assetCardDisabled,
            ]}
          >
            <View style={styles.assetHeader}>
              <View style={styles.assetHeaderLeft}>
                <Text style={styles.assetType}>
                  {RWAService.getAssetTypeName(asset.assetType)}
                </Text>
                <Text style={styles.assetName}>{asset.name}</Text>
              </View>
              <View style={styles.assetYieldBadge}>
                <Text style={styles.assetYieldRate}>{formatYieldRate(asset.yieldRate)}</Text>
                <Text style={styles.assetYieldLabel}>APY</Text>
              </View>
            </View>

            <View style={styles.assetDetails}>
              <View style={styles.assetDetailRow}>
                <Text style={styles.assetDetailLabel}>TOTAL_VALUE</Text>
                <Text style={styles.assetDetailValue}>
                  {formatCurrency(asset.totalValue)}
                </Text>
              </View>
              <View style={styles.assetDetailRow}>
                <Text style={styles.assetDetailLabel}>TOKENIZED</Text>
                <Text style={styles.assetDetailValue}>
                  {formatCurrency(asset.tokenizedValue)}
                </Text>
              </View>
              <View style={styles.assetDetailRow}>
                <Text style={styles.assetDetailLabel}>LAST_YIELD</Text>
                <Text style={styles.assetDetailValue}>
                  {asset.lastYieldDate.toLocaleDateString()}
                </Text>
              </View>
            </View>

            {isVerified ? (
              <TouchableOpacity
                style={styles.investButton}
                onPress={() =>
                  navigation.navigate('RWAInvestment', { asset })
                }
              >
                <Text style={styles.investButtonText}>INVEST_NOW</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒 KYC_REQUIRED</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ ABOUT_RWA</Text>
        <Text style={styles.infoText}>
          Real World Assets (RWA) are traditional assets tokenized on the blockchain. This enables:
        </Text>
        <Text style={styles.infoBullet}>• Fractional ownership of high-value assets</Text>
        <Text style={styles.infoBullet}>• 24/7 trading and instant settlement</Text>
        <Text style={styles.infoBullet}>• Transparent yield distribution</Text>
        <Text style={styles.infoBullet}>• Lower minimum investment amounts</Text>
        <Text style={styles.infoBullet}>• Automated compliance with KYC/AML</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycBadge: {
    fontSize: 24,
  },
  kycVerified: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycTier: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycJurisdiction: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  accreditedBadge: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycNotVerified: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  kycDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  verifyButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldCard: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  yieldAsset: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldAmountContainer: {
    alignItems: 'flex-end',
  },
  yieldAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldCurrency: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  claimButton: {
    padding: 12,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  claimedBadge: {
    padding: 12,
    backgroundColor: `${COLORS.success}20`,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 14,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetCard: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assetCardDisabled: {
    opacity: 0.6,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  assetHeaderLeft: {
    flex: 1,
  },
  assetType: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetYieldBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  assetYieldRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetYieldLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetDetails: {
    gap: 8,
    marginBottom: 16,
  },
  assetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetDetailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetDetailValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  investButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lockedBadge: {
    padding: 12,
    backgroundColor: `${COLORS.error}20`,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: COLORS.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoBullet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bottomSpacer: {
    height: 40,
  },
});
