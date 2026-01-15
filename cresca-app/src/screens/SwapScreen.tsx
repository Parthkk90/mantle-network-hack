import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useTransactions } from '../context/TransactionContext';
import { MANTLE_SEPOLIA } from '../config/constants';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  color: string;
}

const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'MNT', name: 'Mantle', balance: '10.5', price: 1.07, color: '#000000' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.05', price: 3254.12, color: '#627EEA' },
  { symbol: 'USDC', name: 'USD Coin', balance: '100.00', price: 1.00, color: '#2775CA' },
  { symbol: 'USDT', name: 'Tether', balance: '50.00', price: 1.00, color: '#26A17B' },
  { symbol: 'WETH', name: 'Wrapped ETH', balance: '0.02', price: 3254.12, color: '#EC627B' },
];

export default function SwapScreen({ navigation }: any) {
  const { addTransaction } = useTransactions();
  const [fromToken, setFromToken] = useState<Token>(AVAILABLE_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(AVAILABLE_TOKENS[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const toAmount = fromAmount 
    ? ((parseFloat(fromAmount) * fromToken.price) / toToken.price).toFixed(6)
    : '';

  const exchangeRate = (fromToken.price / toToken.price).toFixed(6);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to swap');
      return;
    }

    if (parseFloat(fromAmount) > parseFloat(fromToken.balance)) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromToken.symbol}`);
      return;
    }

    setLoading(true);
    
    // Simulate swap transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transaction hash (in production this would come from actual swap)
    const mockTxHash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    
    // Save swap transaction
    await addTransaction({
      type: 'swap',
      status: 'confirmed',
      txHash: mockTxHash,
      amount: fromAmount,
      token: fromToken.symbol,
      metadata: {
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: fromAmount,
        toAmount: toAmount,
        exchangeRate: exchangeRate,
      },
    });
    
    setLoading(false);
    Alert.alert(
      'Swap Successful',
      `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
      [
        {
          text: 'View on Explorer',
          onPress: () => {
            Linking.openURL(`${MANTLE_SEPOLIA.explorerUrl}/tx/${mockTxHash}`);
          },
        },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]
    );
  };

  const TokenPicker = ({ 
    tokens, 
    selectedToken, 
    onSelect, 
    onClose 
  }: { 
    tokens: Token[], 
    selectedToken: Token, 
    onSelect: (token: Token) => void, 
    onClose: () => void 
  }) => (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Token</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {tokens.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.pickerItem,
                selectedToken.symbol === token.symbol && styles.pickerItemSelected
              ]}
              onPress={() => {
                onSelect(token);
                onClose();
              }}
            >
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                <Text style={[styles.tokenInitial, { color: token.color }]}>
                  {token.symbol.charAt(0)}
                </Text>
              </View>
              <View style={styles.tokenPickerInfo}>
                <Text style={styles.tokenPickerSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenPickerName}>{token.name}</Text>
              </View>
              <Text style={styles.tokenPickerBalance}>{token.balance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Token */}
        <View style={styles.swapCard}>
          <Text style={styles.swapLabel}>You Pay</Text>
          <View style={styles.swapInputRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => setShowFromPicker(true)}
            >
              <View style={[styles.tokenIconSmall, { backgroundColor: fromToken.color + '20' }]}>
                <Text style={[styles.tokenInitialSmall, { color: fromToken.color }]}>
                  {fromToken.symbol.charAt(0)}
                </Text>
              </View>
              <Text style={styles.tokenSelectorText}>{fromToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>Balance: {fromToken.balance} {fromToken.symbol}</Text>
            <TouchableOpacity onPress={() => setFromAmount(fromToken.balance)}>
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapArrowButton} onPress={handleSwapTokens}>
            <Ionicons name="swap-vertical" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={styles.swapCard}>
          <Text style={styles.swapLabel}>You Receive</Text>
          <View style={styles.swapInputRow}>
            <Text style={[styles.amountInput, styles.amountOutput]}>
              {toAmount || '0.0'}
            </Text>
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => setShowToPicker(true)}
            >
              <View style={[styles.tokenIconSmall, { backgroundColor: toToken.color + '20' }]}>
                <Text style={[styles.tokenInitialSmall, { color: toToken.color }]}>
                  {toToken.symbol.charAt(0)}
                </Text>
              </View>
              <Text style={styles.tokenSelectorText}>{toToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceText}>Balance: {toToken.balance} {toToken.symbol}</Text>
        </View>

        {/* Exchange Rate */}
        {fromAmount && (
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Exchange Rate</Text>
              <Text style={styles.rateValue}>
                1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
              </Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Network Fee</Text>
              <Text style={styles.rateValue}>~$0.02</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Slippage Tolerance</Text>
              <Text style={styles.rateValue}>0.5%</Text>
            </View>
          </View>
        )}

        {/* Swap Button */}
        <TouchableOpacity
          style={[styles.swapButton, (!fromAmount || loading) && styles.swapButtonDisabled]}
          onPress={handleSwap}
          disabled={!fromAmount || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <Text style={styles.swapButtonText}>
              {!fromAmount ? 'Enter Amount' : 'Swap'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Token Pickers */}
      {showFromPicker && (
        <TokenPicker
          tokens={AVAILABLE_TOKENS.filter(t => t.symbol !== toToken.symbol)}
          selectedToken={fromToken}
          onSelect={setFromToken}
          onClose={() => setShowFromPicker(false)}
        />
      )}
      {showToPicker && (
        <TokenPicker
          tokens={AVAILABLE_TOKENS.filter(t => t.symbol !== fromToken.symbol)}
          selectedToken={toToken}
          onSelect={setToToken}
          onClose={() => setShowToPicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  swapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swapLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  swapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.text,
  },
  amountOutput: {
    color: COLORS.textSecondary,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  tokenIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenInitialSmall: {
    fontSize: 14,
    fontWeight: '700',
  },
  tokenSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  maxButton: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: -12,
    zIndex: 1,
  },
  swapArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  swapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  swapButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  swapButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  tokenPickerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tokenPickerSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  tokenPickerName: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  tokenPickerBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
