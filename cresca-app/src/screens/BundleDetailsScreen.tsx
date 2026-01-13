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
} from 'react-native';
import Slider from '@react-native-community/slider';
import WalletService from '../services/WalletService';
import BundleService from '../services/BundleService';
import { COLORS } from '../theme/colors';

export default function BundleDetailsScreen({ route, navigation }: any) {
  const { bundle } = route.params;
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [position, setPosition] = useState<'LONG' | 'SHORT'>('LONG');
  const [loading, setLoading] = useState(false);

  const calculateTotalExposure = () => {
    const investmentAmount = parseFloat(amount) || 0;
    return (investmentAmount * leverage).toFixed(2);
  };

  const handleExecuteTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid investment amount');
      return;
    }

    const totalExposure = calculateTotalExposure();
    
    Alert.alert(
      'Confirm Trade',
      `Execute ${position} position?\n\nInvestment: ${amount} MNT\nLeverage: ${leverage}x\nTotal Exposure: ${totalExposure} MNT`,
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
      // Invest in bundle using BundleService with leverage and position
      const txHash = await BundleService.investInBundle(
        bundle.address || bundle.id,
        amount,
        leverage,
        position.toLowerCase() as 'long' | 'short'
      );
      
      Alert.alert(
        'Investment Successful',
        `Successfully invested ${amount} MNT in ${bundle.name}\n\nTransaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        [
          {
            text: 'View Portfolio',
            onPress: () => navigation.navigate('BundlesTab'),
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'<- BACK'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{'>> BUNDLE_TRADING'}</Text>
          <Text style={styles.subtitle}>{bundle.name?.toUpperCase() || 'THE STANDARD BUNDLE'}</Text>
        </View>

        <View style={styles.bundleInfo}>
          <Text style={styles.compositionText}>
            {bundle.composition || 'BTC 50% • ETH 30% • SOL 20%'}
          </Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>
              {parseFloat(bundle.apy || '0') > 12 ? 'HIGH RISK' : parseFloat(bundle.apy || '0') > 9 ? 'MEDIUM RISK' : 'LOW RISK'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'>> INVESTMENT_AMOUNT'}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputSuffix}>MNT</Text>
          </View>
          <Text style={styles.minAmount}>MINIMUM: 0.1 MNT</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.leverageHeader}>
            <Text style={styles.sectionLabel}>{'>> LEVERAGE'}</Text>
            <View style={styles.leverageValue}>
              <Text style={styles.leverageValueText}>{leverage}x</Text>
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={leverage}
            onValueChange={setLeverage}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1x</Text>
            <Text style={styles.sliderLabel}>20x</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'>> POSITION_DIRECTION'}</Text>
          <View style={styles.positionButtons}>
            <TouchableOpacity
              style={[
                styles.positionButton,
                styles.positionButtonLong,
                position === 'LONG' && styles.positionButtonLongActive
              ]}
              onPress={() => setPosition('LONG')}
            >
              <Text style={[
                styles.positionButtonText,
                position === 'LONG' && styles.positionButtonTextActive
              ]}>
                ↗ LONG
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
              <Text style={[
                styles.positionButtonTextShort,
                position === 'SHORT' && styles.positionButtonTextShortActive
              ]}>
                ↘ SHORT
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.positionHint}>
            {position === 'LONG' 
              ? 'PROFIT_WHEN_BUNDLE_PRICE_INCREASES' 
              : 'PROFIT_WHEN_BUNDLE_PRICE_DECREASES'}
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>{'>> TRANSACTION_SUMMARY'}</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>INVESTMENT</Text>
              <Text style={styles.summaryValue}>{amount || '0'} MNT</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>LEVERAGE</Text>
              <Text style={styles.summaryValue}>{leverage}x</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>POSITION</Text>
              <Text style={[
                styles.summaryValue,
                position === 'LONG' ? styles.summaryValueLong : styles.summaryValueShort
              ]}>
                {position}
              </Text>
            </View>
            
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>TOTAL_EXPOSURE</Text>
              <Text style={styles.summaryValueTotal}>{calculateTotalExposure()} MNT</Text>
            </View>
          </View>
        </View>

        {leverage > 1 && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>⚠</Text>
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>TRADING_RISK</Text>
              <Text style={styles.warningText}>
                Leveraged trading involves significant risk. You may lose more than your initial investment.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.executeButton, loading && styles.executeButtonDisabled]}
          onPress={handleExecuteTrade}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.executeButtonText}>{'🚀 EXECUTE_TRADE'}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.executionSteps}>
          This will execute: init → create_bucket → deposit → open_position
        </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bundleInfo: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compositionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    flex: 1,
  },
  riskBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: COLORS.textWhite,
    paddingVertical: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputSuffix: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  minAmount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  leverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leverageValue: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leverageValueText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  positionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  positionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  positionButtonLong: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary,
  },
  positionButtonLongActive: {
    backgroundColor: COLORS.primary,
  },
  positionButtonShort: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.error,
  },
  positionButtonShortActive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  positionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  positionButtonTextActive: {
    color: COLORS.background,
  },
  positionButtonTextShort: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  positionButtonTextShortActive: {
    color: COLORS.error,
  },
  positionHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summarySection: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValue: {
    fontSize: 12,
    color: COLORS.textWhite,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValueLong: {
    color: COLORS.primary,
  },
  summaryValueShort: {
    color: COLORS.error,
  },
  summaryLabelTotal: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  summaryValueTotal: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  warningCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    flexDirection: 'row',
  },
  warningIcon: {
    marginRight: 12,
  },
  warningIconText: {
    fontSize: 24,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  warningText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  executeButton: {
    marginHorizontal: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  executeButtonDisabled: {
    opacity: 0.5,
  },
  executeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  executionSteps: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
