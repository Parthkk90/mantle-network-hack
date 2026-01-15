import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAsync } from '../hooks/useAsync';
import { COLORS } from '../theme/colors';
import { MarketsScreenSkeleton } from '../components/Shimmer';
import MiniLineChart from '../components/MiniLineChart';

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  color: string;
}

// Extended token list for Markets view
const MARKET_TOKENS: Token[] = [
  { id: '1', name: 'Aave', symbol: 'AAVE', price: 170.51, change24h: 1.33, marketCap: 2540000000, volume24h: 125000000, color: '#B6509E' },
  { id: '2', name: 'Algorand', symbol: 'ALGO', price: 0.131160, change24h: 0.69, marketCap: 1080000000, volume24h: 45000000, color: '#000000' },
  { id: '3', name: 'Aptos', symbol: 'APT', price: 1.89, change24h: 2.88, marketCap: 890000000, volume24h: 65000000, color: '#4CD080' },
  { id: '4', name: 'Avalanche', symbol: 'AVAX', price: 12.89, change24h: -0.65, marketCap: 5340000000, volume24h: 215000000, color: '#E84142' },
  { id: '5', name: 'Axie Infinity', symbol: 'AXS', price: 1.02, change24h: 1.20, marketCap: 145000000, volume24h: 12000000, color: '#0055D5' },
  { id: '6', name: 'Balancer', symbol: 'BAL', price: 0.631292, change24h: -1.27, marketCap: 42000000, volume24h: 3500000, color: '#1E1E1E' },
  { id: '7', name: 'Bitcoin', symbol: 'BTC', price: 87372.42, change24h: 1.20, marketCap: 1720000000000, volume24h: 35000000000, color: '#F7931A' },
  { id: '8', name: 'BNB', symbol: 'BNB', price: 843.89, change24h: 0.85, marketCap: 130000000000, volume24h: 1500000000, color: '#F3BA2F' },
  { id: '9', name: 'Mantle', symbol: 'MNT', price: 1.07, change24h: 2.76, marketCap: 3490000000, volume24h: 125000000, color: '#000000' },
  { id: '10', name: 'Ethereum', symbol: 'ETH', price: 3254.12, change24h: 3.71, marketCap: 391000000000, volume24h: 15000000000, color: '#627EEA' },
  { id: '11', name: 'Solana', symbol: 'SOL', price: 142.35, change24h: 4.21, marketCap: 65000000000, volume24h: 2800000000, color: '#9945FF' },
  { id: '12', name: 'USD Coin', symbol: 'USDC', price: 1.00, change24h: 0.01, marketCap: 42000000000, volume24h: 6000000000, color: '#2775CA' },
];

type SortOption = 'name' | 'price' | 'change';

export default function MarketsScreen({ navigation }: any) {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortAscending, setSortAscending] = useState(true);

  // Fetch tokens with async hook
  const fetchTokens = useCallback(async (): Promise<Token[]> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MARKET_TOKENS;
  }, []);

  const { 
    data: rawTokens, 
    loading, 
    refresh 
  } = useAsync(fetchTokens, true, 'market-tokens');

  // Sort tokens using useMemo for performance
  const tokens = useMemo(() => {
    if (!rawTokens) return [];
    
    let sortedTokens = [...rawTokens];
    
    if (sortBy === 'price') {
      sortedTokens.sort((a, b) => sortAscending ? a.price - b.price : b.price - a.price);
    } else if (sortBy === 'change') {
      sortedTokens.sort((a, b) => sortAscending ? a.change24h - b.change24h : b.change24h - a.change24h);
    } else {
      sortedTokens.sort((a, b) => sortAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    }
    
    return sortedTokens;
  }, [rawTokens, sortBy, sortAscending]);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const toggleSort = useCallback(() => {
    setSortAscending(prev => !prev);
  }, []);

  const formatPrice = useCallback((price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }, []);

  // Show shimmer during initial load
  const isInitialLoading = loading && !rawTokens;
  if (isInitialLoading) {
    return <MarketsScreenSkeleton />;
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'price': return sortAscending ? 'Price (Low to High)' : 'Price (High to Low)';
      case 'change': return sortAscending ? 'Change (Low to High)' : 'Change (High to Low)';
      default: return sortAscending ? 'Alphabet (A-Z)' : 'Alphabet (Z-A)';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="search-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterTab, sortBy === 'name' && styles.filterTabActive]}
            onPress={() => { setSortBy('name'); setSortAscending(true); }}
          >
            <Text style={[styles.filterText, sortBy === 'name' && styles.filterTextActive]}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, sortBy === 'price' && !sortAscending && styles.filterTabActive]}
            onPress={() => { setSortBy('price'); setSortAscending(false); }}
          >
            <Text style={[styles.filterText, sortBy === 'price' && !sortAscending && styles.filterTextActive]}>Highest Price</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, sortBy === 'price' && sortAscending && styles.filterTabActive]}
            onPress={() => { setSortBy('price'); setSortAscending(true); }}
          >
            <Text style={[styles.filterText, sortBy === 'price' && sortAscending && styles.filterTextActive]}>Lowest Price</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, sortBy === 'change' && !sortAscending && styles.filterTabActive]}
            onPress={() => { setSortBy('change'); setSortAscending(false); }}
          >
            <Text style={[styles.filterText, sortBy === 'change' && !sortAscending && styles.filterTextActive]}>Top Gainers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, sortBy === 'change' && sortAscending && styles.filterTabActive]}
            onPress={() => { setSortBy('change'); setSortAscending(true); }}
          >
            <Text style={[styles.filterText, sortBy === 'change' && sortAscending && styles.filterTextActive]}>Top Losers</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Token List */}
      <ScrollView
        style={styles.tokensList}
        refreshControl={
          <RefreshControl 
            refreshing={loading && !!rawTokens}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {tokens.map((token) => (
          <TouchableOpacity
            key={token.id}
            style={styles.tokenCard}
            onPress={() => navigation.navigate('TokenDetails', { token })}
          >
            <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
              <Text style={[styles.tokenInitial, { color: token.color }]}>
                {token.symbol.charAt(0)}
              </Text>
            </View>
            
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </View>

            <View style={styles.chartContainer}>
              <MiniLineChart 
                isPositive={token.change24h >= 0}
                width={56}
                height={28}
              />
            </View>

            <View style={styles.tokenPriceContainer}>
              <Text style={styles.priceValue}>{formatPrice(token.price)}</Text>
              <Text style={[
                styles.priceChange,
                token.change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative
              ]}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </Text>
            </View>

            <TouchableOpacity style={styles.expandButton}>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        
        <View style={styles.bottomSpacer} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textWhite,
  },
  tokensList: {
    flex: 1,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  tokenSymbol: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chartContainer: {
    marginRight: 12,
    width: 56,
    height: 28,
  },
  tokenPriceContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  priceChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceChangePositive: {
    color: COLORS.accentGreen,
  },
  priceChangeNegative: {
    color: COLORS.accentRed,
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});
