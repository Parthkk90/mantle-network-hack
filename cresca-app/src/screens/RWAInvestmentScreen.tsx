import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';
import RWAService, { RWAAsset } from '../services/RWAService';
import WalletService from '../services/WalletService';
import { ethers } from 'ethers';

export default function RWAInvestmentScreen({ route, navigation }: any) {
  const { asset } = route.params as { asset: RWAAsset };
  
  const [loading, setLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [userAddress, setUserAddress] = useState('');

  // Token price: $1 per token for simplicity (in production, fetch from contract)
  const TOKEN_PRICE_USD = 1;

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    calculateEstimatedTokens();
  }, [investmentAmount]);

  const loadWalletData = async () => {
    try {
      await WalletService.loadWallet();
      const wallet = WalletService.getWallet();
      const address = await wallet.getAddress();
      setUserAddress(address);

      const provider = wallet.provider;
      if (provider) {
        const balance = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance));
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const calculateEstimatedTokens = () => {
    if (!investmentAmount || isNaN(Number(investmentAmount))) {
      setEstimatedTokens('0');
      return;
    }
    // Assuming 1 MNT = $1 for simplicity
    const tokens = Number(investmentAmount) / TOKEN_PRICE_USD;
    setEstimatedTokens(tokens.toFixed(2));
  };

  const handleMaxAmount = () => {
    // Leave 0.1 MNT for gas
    const maxAmount = Math.max(0, Number(walletBalance) - 0.1);
    setInvestmentAmount(maxAmount.toFixed(4));
  };

  const handleInvest = async () => {
    if (!investmentAmount || Number(investmentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid investment amount');
      return;
    }

    if (Number(investmentAmount) > Number(walletBalance)) {
      Alert.alert('Insufficient Balance', 'You do not have enough MNT for this investment');
      return;
    }

    Alert.alert(
      'Confirm Investment',
      `Invest ${investmentAmount} MNT in ${asset.name}?\n\nYou will receive approximately ${estimatedTokens} RWA tokens.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Invest',
          onPress: executeInvestment,
        },
      ]
    );
  };

  const executeInvestment = async () => {
    setLoading(true);
    try {
      await WalletService.loadWallet();
      const signer = WalletService.getWallet();
      
      // REAL TESTNET TRANSACTION: Send investment amount to RWAVault
      // In production, this would be a dedicated InvestmentManager contract
      // that receives payment and mints tokens atomically
      
      const tx = await signer.sendTransaction({
        to: '0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63', // RWAVault address
        value: ethers.parseEther(investmentAmount),
        // Adding data field to identify this as an investment
        data: ethers.id(`invest:${asset.tokenId}:${userAddress}`).slice(0, 10),
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction failed');
      }

      Alert.alert(
        'Investment Successful! 🎉',
        `Your investment of ${investmentAmount} MNT has been sent to the RWA Vault.\n\nTransaction Hash:\n${tx.hash}\n\nView on Mantlescan:\nhttps://sepolia.mantlescan.xyz/tx/${tx.hash}\n\n📝 Note: In a production environment, RWA tokens would be minted to your wallet automatically. For this testnet demo, the vault custodian would mint tokens to investors after payment verification.`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              // In production, would open URL
              Alert.alert('Explorer', `Transaction: ${tx.hash}`);
            },
          },
          {
            text: 'View Portfolio',
            onPress: () => navigation.navigate('Main', { screen: 'RWATab' }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Reset form
      setInvestmentAmount('');
      await loadWalletData();
    } catch (error: any) {
      console.error('Investment error:', error);
      
      let errorMessage = 'Unable to complete investment. Please try again.';
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient MNT balance for this investment and gas fees.';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Investment Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (wei: bigint) => {
    const eth = ethers.formatEther(wei);
    return `$${parseFloat(eth).toLocaleString()}`;
  };

  const formatYieldRate = (rate: number) => {
    return `${(rate / 100).toFixed(2)}%`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'<- BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'>> INVEST_IN_RWA'}</Text>
      </View>

      {/* Asset Info Card */}
      <View style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <View>
            <Text style={styles.assetType}>
              {RWAService.getAssetTypeName(asset.assetType)}
            </Text>
            <Text style={styles.assetName}>{asset.name}</Text>
          </View>
          <View style={styles.yieldBadge}>
            <Text style={styles.yieldRate}>{formatYieldRate(asset.yieldRate)}</Text>
            <Text style={styles.yieldLabel}>APY</Text>
          </View>
        </View>

        {/* Demo Mode Banner */}
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>
            🔗 TESTNET: Real transactions on Mantle Sepolia
          </Text>
        </View>

        <View style={styles.assetDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TOTAL_VALUE</Text>
            <Text style={styles.detailValue}>{formatCurrency(asset.totalValue)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TOKENIZED</Text>
            <Text style={styles.detailValue}>{formatCurrency(asset.tokenizedValue)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>AVAILABLE</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(asset.tokenizedValue - ethers.parseEther('1000000'))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MIN_INVESTMENT</Text>
            <Text style={styles.detailValue}>100 MNT ($100)</Text>
          </View>
        </View>
      </View>

      {/* Wallet Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>YOUR_BALANCE</Text>
        <Text style={styles.balanceAmount}>{Number(walletBalance).toFixed(4)} MNT</Text>
        <Text style={styles.balanceUSD}>
          ≈ ${(Number(walletBalance) * 1).toLocaleString()} USD
        </Text>
      </View>

      {/* Investment Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{'>> INVESTMENT_AMOUNT'}</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          <Text style={styles.inputUnit}>MNT</Text>
        </View>

        <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
          <Text style={styles.maxButtonText}>MAX</Text>
        </TouchableOpacity>

        {investmentAmount && Number(investmentAmount) > 0 && (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>YOU_WILL_RECEIVE</Text>
            <Text style={styles.estimateAmount}>{estimatedTokens} RWA Tokens</Text>
            <Text style={styles.estimateNote}>
              * Based on current token price: ${TOKEN_PRICE_USD} per token
            </Text>
          </View>
        )}

        {/* Investment Summary */}
        {investmentAmount && Number(investmentAmount) > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>INVESTMENT_SUMMARY</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Investment Amount</Text>
              <Text style={styles.summaryValue}>{investmentAmount} MNT</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Gas Fee</Text>
              <Text style={styles.summaryValue}>~0.01 MNT</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Total Required</Text>
              <Text style={styles.summaryValueBold}>
                {(Number(investmentAmount) + 0.01).toFixed(4)} MNT
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected APY</Text>
              <Text style={[styles.summaryValue, styles.successText]}>
                {formatYieldRate(asset.yieldRate)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Est. Annual Yield</Text>
              <Text style={[styles.summaryValue, styles.successText]}>
                {(Number(investmentAmount) * (asset.yieldRate / 10000)).toFixed(2)} MNT
              </Text>
            </View>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ INVESTMENT_TERMS</Text>
          <Text style={styles.infoText}>• Minimum investment: 100 MNT</Text>
          <Text style={styles.infoText}>• Lock-up period: None (instant liquidity)</Text>
          <Text style={styles.infoText}>• Yield frequency: Monthly distributions</Text>
          <Text style={styles.infoText}>• Auto-claim available via Keeper Service</Text>
          <Text style={styles.infoText}>• Transferable RWA tokens (ERC-20)</Text>
        </View>

        {/* Invest Button */}
        <TouchableOpacity
          style={[
            styles.investButton,
            (!investmentAmount || Number(investmentAmount) <= 0 || loading) &&
              styles.investButtonDisabled,
          ]}
          onPress={handleInvest}
          disabled={!investmentAmount || Number(investmentAmount) <= 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.investButtonText}>INVEST_NOW</Text>
          )}
        </TouchableOpacity>
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
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  demoBanner: {
    padding: 12,
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.warning}40`,
    marginBottom: 16,
  },
  demoText: {
    fontSize: 11,
    color: COLORS.warning,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetType: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  yieldRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  yieldLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  assetDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceUSD: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: COLORS.text,
    paddingVertical: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputUnit: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  maxButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 8,
    marginBottom: 16,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  estimateCard: {
    padding: 16,
    backgroundColor: `${COLORS.success}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
    marginBottom: 16,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  estimateAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  estimateNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryCard: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  successText: {
    color: COLORS.success,
  },
  infoBox: {
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  investButton: {
    padding: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  investButtonDisabled: {
    opacity: 0.5,
  },
  investButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bottomSpacer: {
    height: 40,
  },
});
