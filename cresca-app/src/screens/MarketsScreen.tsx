import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import BundleService, { Bundle } from '../services/BundleService';
import { COLORS } from '../theme/colors';

export default function MarketsScreen({ navigation }: any) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'apy' | 'tvl'>('name');

  useEffect(() => {
    loadBundles();
  }, [sortBy]);

  const loadBundles = async () => {
    try {
      const allBundles = await BundleService.getAllBundles();
      
      let sortedBundles = [...allBundles];
      
      if (sortBy === 'apy') {
        sortedBundles.sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));
      } else if (sortBy === 'tvl') {
        sortedBundles.sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl));
      } else {
        sortedBundles.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setBundles(sortedBundles);
    } catch (error) {
      console.error('Load bundles error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBundles();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'>> INVESTMENT_BUNDLES'}</Text>
        <Text style={styles.subtitle}>CURATED_PORTFOLIOS</Text>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'apy' && styles.sortButtonActive]}
            onPress={() => setSortBy('apy')}
          >
            <Text style={[styles.sortText, sortBy === 'apy' && styles.sortTextActive]}>APY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'tvl' && styles.sortButtonActive]}
            onPress={() => setSortBy('tvl')}
          >
            <Text style={[styles.sortText, sortBy === 'tvl' && styles.sortTextActive]}>TVL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.tokensList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {bundles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{'[NO_BUNDLES_AVAILABLE]'}</Text>
            <Text style={styles.emptyText}>
              NO_CURATED_BUNDLES_FOUND
            </Text>
          </View>
        ) : (
          bundles.map((bundle) => (
            <TouchableOpacity
              key={bundle.id}
              style={styles.tokenCard}
              onPress={() => navigation.navigate('BundleDetails', { bundle })}
            >
              <View style={styles.tokenIcon}>
                <Text style={styles.tokenInitial}>{bundle.symbol.charAt(0)}</Text>
              </View>
              
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>{bundle.name.toUpperCase()}</Text>
                <Text style={styles.tokenSymbol}>{bundle.composition}</Text>
              </View>

              <View style={styles.tokenPrice}>
                <Text style={styles.priceValue}>{bundle.apy}% APY</Text>
                <Text style={styles.priceChange}>
                  TVL: {bundle.tvl} MNT
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
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
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  sortButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
  },
  sortText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '600',
  },
  sortTextActive: {
    color: COLORS.primary,
  },
  tokensList: {
    flex: 1,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tokenSymbol: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tokenPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  priceChange: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  priceChangePositive: {
    color: COLORS.primary,
  },
  priceChangeNegative: {
    color: COLORS.error,
  },
});
