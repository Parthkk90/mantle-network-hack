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
import { COLORS } from '../theme/colors';

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

// Mantle Network tokens
const MANTLE_TOKENS: Token[] = [
  { id: '1', name: 'Mantle', symbol: 'MNT', price: 1.07, change24h: 2.76, marketCap: 3490000000, volume24h: 125000000 },
  { id: '2', name: 'Wrapped Mantle', symbol: 'WMNT', price: 1.07, change24h: 2.76, marketCap: 145000000, volume24h: 8500000 },
  { id: '3', name: 'USD Coin', symbol: 'USDC', price: 1.00, change24h: 0.01, marketCap: 42000000000, volume24h: 6000000000 },
  { id: '4', name: 'Tether', symbol: 'USDT', price: 0.99, change24h: -0.02, marketCap: 140000000000, volume24h: 95000000000 },
  { id: '5', name: 'Wrapped Ethereum', symbol: 'WETH', price: 3254.12, change24h: 3.71, marketCap: 391000000000, volume24h: 15000000000 },
  { id: '6', name: 'Wrapped Bitcoin', symbol: 'WBTC', price: 92068.68, change24h: 1.85, marketCap: 1820000000000, volume24h: 35000000000 },
];

export default function MarketsScreen({ navigation }: any) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');

  useEffect(() => {
    loadTokens();
  }, [sortBy]);

  const loadTokens = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let sortedTokens = [...MANTLE_TOKENS];
      
      if (sortBy === 'price') {
        sortedTokens.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'change') {
        sortedTokens.sort((a, b) => b.change24h - a.change24h);
      } else {
        sortedTokens.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setTokens(sortedTokens);
    } catch (error) {
      console.error('Load tokens error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTokens();
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
        <Text style={styles.title}>{'>> MARKETS'}</Text>
        <Text style={styles.subtitle}>MANTLE_NETWORK_ASSETS</Text>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortText, sortBy === 'price' && styles.sortTextActive]}>PRICE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'change' && styles.sortButtonActive]}
            onPress={() => setSortBy('change')}
          >
            <Text style={[styles.sortText, sortBy === 'change' && styles.sortTextActive]}>CHG</Text>
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
        {tokens.map((token) => (
          <TouchableOpacity
            key={token.id}
            style={styles.tokenCard}
            onPress={() => navigation.navigate('TokenDetails', { token })}
          >
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenInitial}>{token.symbol.charAt(0)}</Text>
            </View>
            
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{token.name.toUpperCase()}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </View>

            <View style={styles.tokenPrice}>
              <Text style={styles.priceValue}>${token.price.toLocaleString()}</Text>
              <Text style={[
                styles.priceChange,
                token.change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative
              ]}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
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
