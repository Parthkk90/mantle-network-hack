import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import WalletService from '../services/WalletService';
import BundleService, { Bundle } from '../services/BundleService';
import { COLORS } from '../theme/colors';

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
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState('0');
  const [totalProfit, setTotalProfit] = useState('0');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      // Fetch user's investments from BundleService
      const userBundles = await BundleService.getUserInvestments();
      
      // Transform to Investment format
      const transformedInvestments: Investment[] = userBundles.map(bundle => {
        const invested = parseFloat(bundle.userInvestment || '0');
        // Estimate current value based on APY (simplified)
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
      
      setInvestments(transformedInvestments);
      
      // Calculate totals
      const totalValue = transformedInvestments.reduce(
        (sum, inv) => sum + parseFloat(inv.currentValue),
        0
      );
      const totalProf = transformedInvestments.reduce(
        (sum, inv) => sum + parseFloat(inv.profit),
        0
      );
      
      setTotalBalance(totalValue.toFixed(2));
      setTotalProfit(totalProf.toFixed(2));
    } catch (error) {
      console.error('Load portfolio error:', error);
      setInvestments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPortfolio();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{'>> MY_PORTFOLIO'}</Text>
        <Text style={styles.subtitle}>INVESTMENT_TRACKING</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{'[TOTAL_VALUE]'}</Text>
        <Text style={styles.totalAmount}>{totalBalance} MNT</Text>
        <View style={styles.profitContainer}>
          <Text style={[styles.profitText, parseFloat(totalProfit) >= 0 ? styles.profitPositive : styles.profitNegative]}>
            {parseFloat(totalProfit) >= 0 ? '+' : ''}{totalProfit} MNT
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{'>> INVESTMENTS'}</Text>
          <Text style={styles.sectionCount}>[{investments.length}]</Text>
        </View>

        {investments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{'[NO_INVESTMENTS]'}</Text>
            <Text style={styles.emptyText}>
              START_INVESTING_IN_BUNDLES
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('MarketsTab')}
            >
              <Text style={styles.browseButtonText}>{'[ BROWSE_MARKETS ]'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          investments.map((investment) => (
            <TouchableOpacity
              key={investment.bundleId}
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
              <View style={styles.investmentHeader}>
                <Text style={styles.investmentName}>{investment.bundleName.toUpperCase()}</Text>
                <Text style={styles.investmentApy}>{investment.apy}%</Text>
              </View>

              <View style={styles.investmentStats}>
                <View style={styles.investmentStat}>
                  <Text style={styles.investmentStatLabel}>INVESTED</Text>
                  <Text style={styles.investmentStatValue}>
                    {parseFloat(investment.invested).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.investmentStat}>
                  <Text style={styles.investmentStatLabel}>CURRENT</Text>
                  <Text style={styles.investmentStatValue}>
                    {parseFloat(investment.currentValue).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.investmentStat}>
                  <Text style={styles.investmentStatLabel}>PROFIT</Text>
                  <Text style={[
                    styles.investmentStatValue,
                    parseFloat(investment.profit) >= 0 ? styles.profitPositive : styles.profitNegative
                  ]}>
                    {parseFloat(investment.profit) >= 0 ? '+' : ''}
                    {parseFloat(investment.profit).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{'>> SUMMARY'}</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL_INVESTED</Text>
            <Text style={styles.summaryValue}>
              {investments.reduce((sum, inv) => sum + parseFloat(inv.invested), 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL_PROFIT</Text>
            <Text style={[styles.summaryValue, styles.profitPositive]}>
              +{totalProfit}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AVG_APY</Text>
            <Text style={styles.summaryValue}>
              {investments.length > 0
                ? (investments.reduce((sum, inv) => sum + parseFloat(inv.apy), 0) / investments.length).toFixed(2)
                : '0'}%
            </Text>
          </View>
        </View>
      </View>
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
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  totalCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  profitPositive: {
    color: COLORS.primary,
  },
  profitNegative: {
    color: COLORS.error,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investmentCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investmentApy: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  investmentStat: {
    flex: 1,
  },
  investmentStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investmentStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
