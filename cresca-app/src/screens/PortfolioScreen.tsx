import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBundles, getRiskLevel, filterByCategory, BundleCategory, BUNDLE_CATEGORIES } from '../hooks/useBundles';
import { useUserInvestments } from '../hooks/useBundles';
import { Bundle } from '../services/BundleService';
import { COLORS } from '../theme/colors';
import { BundlesScreenSkeleton } from '../components/Shimmer';
import AnimatedNumber from '../components/AnimatedNumber';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';

interface Investment {
  bundleId: string;
  bundleName: string;
  invested: string;
  currentValue: string;
  profit: string;
  profitPercent: string;
  apy: string;
}

export default function PortfolioScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Use hooks for data fetching with caching
  const { 
    data: allBundles, 
    loading: bundlesLoading, 
    refresh: refreshBundles 
  } = useBundles();

  const {
    data: userInvestments,
    loading: investmentsLoading,
    refresh: refreshInvestments,
  } = useUserInvestments();

  // Transform user investments
  const investments = useMemo((): Investment[] => {
    if (!userInvestments) return [];
    return userInvestments.map(bundle => {
      const invested = parseFloat(bundle.userInvestment || '0');
      const currentValue = invested * (1 + parseFloat(bundle.apy) / 100 / 12);
      const profit = currentValue - invested;
      const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
      
      return {
        bundleId: bundle.id,
        bundleName: bundle.name,
        invested: invested.toFixed(2),
        currentValue: currentValue.toFixed(2),
        profit: profit.toFixed(2),
        profitPercent: profitPercent.toFixed(2),
        apy: bundle.apy,
      };
    });
  }, [userInvestments]);

  // Calculate totals
  const { totalBalance, totalProfit } = useMemo(() => {
    const totalValue = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.currentValue),
      0
    );
    const totalProf = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.profit),
      0
    );
    return {
      totalBalance: totalValue.toFixed(2),
      totalProfit: totalProf.toFixed(2),
    };
  }, [investments]);

  // Filter bundles by search only (no categories)
  const filteredBundles = useMemo(() => {
    if (!allBundles) return [];
    
    if (searchQuery) {
      return allBundles.filter(bundle =>
        bundle.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allBundles;
  }, [allBundles, searchQuery]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshBundles(), refreshInvestments()]);
  }, [refreshBundles, refreshInvestments]);

  const getRiskDisplay = (apy: string) => {
    const level = getRiskLevel(apy);
    const colors = {
      Low: '#22C55E',
      Medium: '#F59E0B',
      High: '#EF4444',
    };
    return { label: `${level} Risk`, color: colors[level] };
  };

  // Show shimmer during initial load
  const isInitialLoading = bundlesLoading && !allBundles;
  if (isInitialLoading) {
    return <BundlesScreenSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={bundlesLoading && !!allBundles}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Investment Bundles</Text>
          <Text style={styles.subtitle}>Diversified crypto portfolios</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name="search" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bundles..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Bundle Cards */}
      <View style={styles.bundlesContainer}>
        {filteredBundles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No bundles found</Text>
            <Text style={styles.emptySubtext}>Try a different category or search term</Text>
          </View>
        ) : (
          filteredBundles.map((bundle, index) => {
            const risk = getRiskDisplay(bundle.apy);
            return (
              <FadeInView key={bundle.id} delay={index * 100}>
                <AnimatedPressable
                  style={styles.bundleCard}
                  onPress={() => navigation.navigate('BundleDetails', { bundle })}
                >
                  <View style={styles.bundleCardHeader}>
                    <View style={styles.bundleIconContainer}>
                      <View style={styles.bundleIcon}>
                        <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
                      </View>
                    </View>
                    <View style={styles.bundleInfo}>
                      <Text style={styles.bundleName}>{bundle.name}</Text>
                      <Text style={styles.bundleComposition}>{bundle.composition}</Text>
                    </View>
                    <View style={styles.bundleReturn}>
                      <AnimatedNumber 
                        value={parseFloat(bundle.apy)} 
                        style={styles.returnValue}
                        suffix="%"
                        decimals={1}
                      />
                      <Text style={styles.returnLabel}>1Y Return</Text>
                    </View>
                  </View>

                  <View style={styles.bundleTags}>
                    {bundle.composition.split(' • ').slice(0, 3).map((token, idx) => (
                      <View key={idx} style={styles.tokenTag}>
                        <Text style={styles.tokenTagText}>{token}</Text>
                      </View>
                    ))}
                    <View style={[styles.riskTag, { backgroundColor: risk.color + '20' }]}>
                      <Text style={[styles.riskTagText, { color: risk.color }]}>{risk.label.split(' ')[0]}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          })
        )}
      </View>

      {/* My Investments Section */}
      {investments.length > 0 && (
        <FadeInView delay={filteredBundles.length * 100 + 100}>
          <View style={styles.investmentsSection}>
            <Text style={styles.sectionTitle}>My Investments</Text>
            
            {investments.map((investment, index) => (
              <FadeInView key={investment.bundleId} delay={filteredBundles.length * 100 + 200 + index * 50}>
                <AnimatedPressable
                  style={styles.investmentCard}
                  onPress={() => {
                    navigation.navigate('BundleDetails', {
                      bundle: {
                        id: investment.bundleId,
                        name: investment.bundleName,
                        apy: investment.apy,
                      }
                    });
                  }}
                >
                  <View style={styles.investmentLeft}>
                    <Text style={styles.investmentName}>{investment.bundleName}</Text>
                    <Text style={styles.investmentInvested}>
                      Invested: {investment.invested} MNT
                    </Text>
                  </View>
                  <View style={styles.investmentRight}>
                    <Text style={[
                      styles.investmentProfit,
                      parseFloat(investment.profit) >= 0 ? styles.profitPositive : styles.profitNegative
                    ]}>
                      {parseFloat(investment.profit) >= 0 ? '+' : ''}{investment.profitPercent}%
                    </Text>
                    <Text style={styles.investmentCurrent}>{investment.currentValue} MNT</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            ))}

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Value</Text>
              <AnimatedNumber 
                value={parseFloat(totalBalance)} 
                style={styles.summaryValue}
                suffix=" MNT"
                decimals={2}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Profit</Text>
              <AnimatedNumber 
                value={parseFloat(totalProfit)} 
                style={StyleSheet.flatten([styles.summaryValue, styles.profitPositive])}
                prefix="+"
                suffix=" MNT"
                decimals={2}
              />
            </View>
          </View>
        </View>
      </FadeInView>
      )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    color: COLORS.textMuted,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.textWhite,
  },
  bundlesContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bundleCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  bundleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bundleIconContainer: {
    marginRight: 12,
  },
  bundleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bundleIconText: {
    fontSize: 20,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bundleComposition: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bundleReturn: {
    alignItems: 'flex-end',
  },
  returnValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentGreen,
    marginBottom: 2,
  },
  returnLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bundleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  tokenTagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  riskTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  investmentsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  investmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  investmentLeft: {
    flex: 1,
  },
  investmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  investmentInvested: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentProfit: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  investmentCurrent: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  profitPositive: {
    color: COLORS.accentGreen,
  },
  profitNegative: {
    color: COLORS.accentRed,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomSpacer: {
    height: 100,
  },
});
