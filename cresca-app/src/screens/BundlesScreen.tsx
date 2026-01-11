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
  price: string;
  change: string;
  isPositive: boolean;
}

const MOCK_TOKENS: Token[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', price: '92068.68', change: '+1.85%', isPositive: true },
  { id: '2', name: 'Ethereum', symbol: 'ETH', price: '3254.12', change: '+3.71%', isPositive: true },
  { id: '3', name: 'Mantle', symbol: 'MNT', price: '1.07', change: '+2.76%', isPositive: true },
  { id: '4', name: 'USD Coin', symbol: 'USDC', price: '1.00', change: '+0.01%', isPositive: true },
  { id: '5', name: 'Tether', symbol: 'USDT', price: '0.99', change: '-0.02%', isPositive: false },
  { id: '6', name: 'Algorand', symbol: 'ALGO', price: '0.136313', change: '+2.76%', isPositive: true },
  { id: '7', name: 'Avalanche', symbol: 'AVAX', price: '14.25', change: '+4.86%', isPositive: true },
  { id: '8', name: 'Aptos', symbol: 'APT', price: '1.78', change: '-1.48%', isPositive: false },
];

export default function BundlesScreen({ navigation }: any) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');

  useEffect(() => {
    loadTokens();
  }, [sortBy]);

  const loadTokens = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let sortedTokens = [...MOCK_TOKENS];
      
      if (sortBy === 'price') {
        sortedTokens.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sortBy === 'change') {
        sortedTokens.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
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
          >
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenInitial}>{token.symbol.charAt(0)}</Text>
            </View>
            
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </View>

            <View style={styles.tokenPrice}>
              <Text style={styles.priceValue}>${token.price}</Text>
              <Text style={[
                styles.priceChange,
                token.isPositive ? styles.priceChangePositive : styles.priceChangeNegative
              ]}>
                {token.change}
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
