import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import WalletService from '../services/WalletService';
import BundleService from '../services/BundleService';
import { COLORS } from '../theme/colors';
import { useTransactions } from '../context/TransactionContext';
import { MANTLE_SEPOLIA } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

// Helper functions for token colors and prices
const getTokenColor = (symbol: string) => {
  const colors: { [key: string]: string } = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'SOL': '#14F195',
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'BNB': '#F3BA2F',
    'MATIC': '#8247E5',
    'MNT': '#0052FF',
  };
  return colors[symbol] || COLORS.primary;
};

const getBasePrice = (symbol: string) => {
  const prices: { [key: string]: number } = {
    'BTC': 50000,
    'ETH': 3000,
    'SOL': 100,
    'USDC': 1,
    'USDT': 1,
    'BNB': 400,
    'MATIC': 1.5,
    'MNT': 1.8,
  };
  return prices[symbol] || 100;
};

// Multi-token line chart component
function MultiTokenChart({ bundle }: { bundle: any }) {
  const [timeframe, setTimeframe] = useState('1D');
  
  // Parse token composition (e.g., "BTC 50% • ETH 30% • SOL 20%")
  const tokens = React.useMemo(() => {
    const composition = bundle.composition || 'BTC 50% • ETH 30% • SOL 20%';
    return composition.split(' • ').map((item: string) => {
      const parts = item.trim().split(' ');
      return {
        symbol: parts[0],
        percentage: parts[1],
        color: getTokenColor(parts[0]),
      };
    });
  }, [bundle.composition]);

  // Generate mock price data for each token
  const generatePriceData = (tokenSymbol: string) => {
    const points = 20;
    const data = [];
    let basePrice = getBasePrice(tokenSymbol);
    
    for (let i = 0; i < points; i++) {
      const variance = (Math.random() - 0.5) * 0.1 * basePrice;
      basePrice += variance;
      data.push(Math.max(0, basePrice));
    }
    return data;
  };

  const createPath = (data: number[]) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    
    const xStep = (CHART_WIDTH - 2 * CHART_PADDING) / (data.length - 1);
    const yScale = (CHART_HEIGHT - 2 * CHART_PADDING) / range;

    let path = '';
    data.forEach((value, index) => {
      const x = CHART_PADDING + index * xStep;
      const y = CHART_HEIGHT - CHART_PADDING - (value - minValue) * yScale;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.header}>
        <Text style={chartStyles.title}>Bundle Performance</Text>
        <View style={chartStyles.timeframes}>
          {['1D', '1W', '1M', '3M'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                chartStyles.timeframeButton,
                timeframe === tf && chartStyles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(tf)}
            >
              <Text
                style={[
                  chartStyles.timeframeText,
                  timeframe === tf && chartStyles.timeframeTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = CHART_PADDING + (i * (CHART_HEIGHT - 2 * CHART_PADDING)) / 4;
          return (
            <Line
              key={i}
              x1={CHART_PADDING}
              y1={y}
              x2={CHART_WIDTH - CHART_PADDING}
              y2={y}
              stroke={COLORS.border}
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}

        {/* Token lines */}
        {tokens.map((token: any, index: number) => {
          const data = generatePriceData(token.symbol);
          const path = createPath(data);
          
          return (
            <Path
              key={index}
              d={path}
              stroke={token.color}
              strokeWidth={2}
              fill="none"
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={chartStyles.legend}>
        {tokens.map((token: any, index: number) => (
          <View key={index} style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: token.color }]} />
            <Text style={chartStyles.legendText}>
              {token.symbol} ({token.percentage})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function BundleDetailsScreen({ route, navigation }: any) {
  const { bundle } = route.params;
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [position, setPosition] = useState<'LONG' | 'SHORT'>('LONG');
  const [loading, setLoading] = useState(false);
  const [leverageInput, setLeverageInput] = useState('1');

  const calculateTotalExposure = () => {
    const investmentAmount = parseFloat(amount) || 0;
    return (investmentAmount * leverage).toFixed(2);
  };

  const getRiskLevel = () => {
    const apy = parseFloat(bundle.apy || '0');
    if (apy > 12) return { label: 'High Risk', color: '#EF4444', bg: '#FEE2E2' };
    if (apy > 9) return { label: 'Medium Risk', color: '#F59E0B', bg: '#FEF3C7' };
    return { label: 'Low Risk', color: '#22C55E', bg: '#DCFCE7' };
  };

  const handleLeverageInputChange = (text: string) => {
    setLeverageInput(text);
    const num = parseInt(text) || 1;
    if (num >= 1 && num <= 20) {
      setLeverage(num);
    } else if (num > 20) {
      setLeverage(20);
      setLeverageInput('20');
    }
  };

  const handleExecuteTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid investment amount');
      return;
    }

    if (parseFloat(amount) < 0.1) {
      Alert.alert('Minimum Amount', 'Minimum investment is 0.1 APT');
      return;
    }

    const totalExposure = calculateTotalExposure();
    
    Alert.alert(
      'Confirm Trade',
      `Execute ${position} position?\n\nInvestment: ${amount} APT\nLeverage: ${leverage}x\nTotal Exposure: ${totalExposure} APT`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: executeTrade,
        },
      ]
    );
  };

  const executeTrade = async () => {
    setLoading(true);
    try {
      const txHash = await BundleService.investInBundle(
        bundle.address || bundle.id,
        amount,
        leverage,
        position.toLowerCase() as 'long' | 'short'
      );
      
      // Save transaction to history
      await addTransaction({
        type: 'bundle_investment',
        status: 'confirmed',
        txHash: txHash,
        amount: amount,
        token: 'MNT',
        metadata: {
          bundleName: bundle.name,
          bundleId: bundle.id,
          leverage: leverage,
          position: position,
          totalExposure: calculateTotalExposure(),
          apy: bundle.apy,
        },
      });
      
      Alert.alert(
        'Investment Successful',
        `Successfully invested ${amount} MNT in ${bundle.name}\n\nTransaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        [
          {
            text: 'View on Explorer',
            onPress: () => Linking.openURL(`${MANTLE_SEPOLIA.explorerUrl}/tx/${txHash}`),
          },
          {
            text: 'View Portfolio',
            onPress: () => navigation.navigate('Main', { screen: 'BundlesTab' }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Investment Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const risk = getRiskLevel();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Basket Trading</Text>
            <Text style={styles.headerSubtitle}>{bundle.name || 'The Standard Basket'}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Bundle Info Card */}
        <View style={styles.bundleCard}>
          <View style={styles.bundleIconContainer}>
            <Ionicons name="pie-chart" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.bundleInfo}>
            <Text style={styles.bundleName}>{bundle.name || 'The Standard Basket'}</Text>
            <Text style={styles.bundleComposition}>
              {bundle.composition || 'BTC 50% • ETH 30% • SOL 20%'}
            </Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: risk.bg }]}>
            <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
          </View>
        </View>

        {/* Multi-Token Chart */}
        <MultiTokenChart bundle={bundle} />

        {/* Investment Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Investment Amount</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputSuffix}>APT</Text>
          </View>
          <Text style={styles.minAmount}>Minimum: 0.1 APT</Text>
        </View>

        {/* Leverage Section */}
        <View style={styles.section}>
          <View style={styles.leverageHeader}>
            <Text style={styles.sectionLabel}>Leverage: {leverage}x</Text>
            <View style={styles.leverageInputContainer}>
              <Text style={styles.leverageInputLabel}>Enter leverage</Text>
              <TextInput
                style={styles.leverageInput}
                value={leverageInput}
                onChangeText={handleLeverageInputChange}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={leverage}
            onValueChange={(value) => {
              setLeverage(value);
              setLeverageInput(value.toString());
            }}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1x</Text>
            <Text style={styles.sliderLabel}>20x</Text>
          </View>
        </View>

        {/* Position Direction */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Position Direction</Text>
          <View style={styles.positionButtons}>
            <TouchableOpacity
              style={[
                styles.positionButton,
                styles.positionButtonLong,
                position === 'LONG' && styles.positionButtonLongActive
              ]}
              onPress={() => setPosition('LONG')}
            >
              <Ionicons name="trending-up" size={20} color={position === 'LONG' ? COLORS.textWhite : COLORS.success} />
              <Text style={[
                styles.positionButtonText,
                position === 'LONG' && styles.positionButtonTextActive
              ]}>
                LONG
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.positionButton,
                styles.positionButtonShort,
                position === 'SHORT' && styles.positionButtonShortActive
              ]}
              onPress={() => setPosition('SHORT')}
            >
              <Ionicons name="trending-down" size={20} color={position === 'SHORT' ? COLORS.textWhite : COLORS.error} />
              <Text style={[
                styles.positionButtonTextShort,
                position === 'SHORT' && styles.positionButtonTextShortActive
              ]}>
                SHORT
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.positionHint}>
            {position === 'LONG' 
              ? 'Profit when basket price increases' 
              : 'Profit when basket price decreases'}
          </Text>
        </View>

        {/* Transaction Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transaction Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Investment</Text>
              <Text style={styles.summaryValue}>{amount || '0'} APT</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Leverage</Text>
              <Text style={styles.summaryValue}>{leverage}x</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Position</Text>
              <Text style={[
                styles.summaryValue,
                position === 'LONG' ? styles.summaryValueLong : styles.summaryValueShort
              ]}>
                {position}
              </Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Total Exposure</Text>
              <Text style={styles.summaryValueBold}>{calculateTotalExposure()} APT</Text>
            </View>
          </View>
        </View>

        {/* Risk Warning */}
        {leverage > 1 && (
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Trading Risk</Text>
              <Text style={styles.warningText}>
                Leveraged trading involves significant risk. You may lose more than your initial investment.
              </Text>
            </View>
          </View>
        )}

        {/* Execute Button */}
        <TouchableOpacity
          style={[styles.executeButton, loading && styles.executeButtonDisabled]}
          onPress={handleExecuteTrade}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <>
              <Ionicons name="flash" size={20} color={COLORS.textWhite} style={{ marginRight: 8 }} />
              <Text style={styles.executeButtonText}>Execute Trade</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.executionSteps}>
          This will execute: Init → Create Bucket → Deposit → Open Position
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  bundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  bundleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bundleIcon: {
    fontSize: 20,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bundleComposition: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: COLORS.text,
    paddingVertical: 16,
  },
  inputSuffix: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  minAmount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  leverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leverageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leverageInputLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leverageInput: {
    width: 60,
    height: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  positionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  positionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  positionButtonLong: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  positionButtonLongActive: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  positionButtonShort: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.accentRed,
  },
  positionButtonShortActive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.accentRed,
  },
  longArrow: {
    fontSize: 16,
    color: COLORS.textWhite,
  },
  shortArrow: {
    fontSize: 16,
    color: COLORS.accentRed,
  },
  positionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  positionButtonTextActive: {
    color: COLORS.textWhite,
  },
  positionButtonTextShort: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  positionButtonTextShortActive: {
    color: COLORS.accentRed,
  },
  positionHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
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
    color: COLORS.text,
    fontWeight: '500',
  },
  summaryValueLong: {
    color: COLORS.accentGreen,
  },
  summaryValueShort: {
    color: COLORS.accentRed,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  summaryLabelBold: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  summaryValueBold: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningIconContainer: {
    marginRight: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    color: COLORS.accentRed,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  executeButtonDisabled: {
    opacity: 0.5,
  },
  executeIcon: {
    fontSize: 18,
  },
  executeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  executionSteps: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

const chartStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeframes: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 36,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: COLORS.text,
  },
  timeframeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: COLORS.textWhite,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
});
