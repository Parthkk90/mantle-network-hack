import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PaymentService from '../services/PaymentService';
import WalletService from '../services/WalletService';
import { useTransactions } from '../context/TransactionContext';
import { MANTLE_SEPOLIA } from '../config/constants';
import { COLORS } from '../theme/colors';

export default function SendScreen({ navigation }: any) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  
  const { addTransaction } = useTransactions();

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const bal = await WalletService.getBalance();
    setBalance(bal);
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient address and amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (numAmount > parseFloat(balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    Alert.alert('Confirm Transaction', `Send ${amount} MNT to ${recipient.slice(0, 8)}...?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: executeSend },
    ]);
  };

  const executeSend = async () => {
    setLoading(true);

    try {
      const walletAddress = await WalletService.getAddress();
      const result = await PaymentService.sendMNT({
        recipient,
        amount,
        note: note || 'Payment via Cresca',
      });

      if (result.success && result.transactionHash) {
        // Save transaction to context
        await addTransaction({
          type: 'send',
          status: 'confirmed',
          txHash: result.transactionHash,
          amount: amount,
          token: 'MNT',
          from: walletAddress,
          to: recipient,
        });

        Alert.alert(
          'Success!',
          `Payment sent successfully!\n\nTransaction: ${result.transactionHash?.slice(0, 10)}...`,
          [
            {
              text: 'View on Explorer',
              onPress: async () => {
                const url = `${MANTLE_SEPOLIA.explorerUrl}/tx/${result.transactionHash}`;
                await Linking.openURL(url);
              },
            },
            {
              text: 'Done',
              onPress: () => {
                setRecipient('');
                setAmount('');
                setNote('');
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = () => {
    const usdValue = (parseFloat(balance) * 1.8).toFixed(2);
    return `$${usdValue} USD`;
  };

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
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{parseFloat(balance).toFixed(4)} MNT</Text>
          <Text style={styles.balanceUsd}>{formatBalance()}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Recipient Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={recipient}
                onChangeText={setRecipient}
                placeholder="0x..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.scanButton}>
                <Ionicons name="camera-outline" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
              <View style={styles.amountRight}>
                <Text style={styles.currencyLabel}>MNT</Text>
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={() => setAmount(balance)}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="What's this for?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Transaction Summary */}
          {amount && parseFloat(amount) > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>{amount} MNT</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Fee</Text>
                <Text style={styles.summaryValue}>~0.0001 MNT</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>Total</Text>
                <Text style={styles.summaryValueBold}>
                  {(parseFloat(amount) + 0.0001).toFixed(4)} MNT
                </Text>
              </View>
            </View>
          )}

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <>
                <Ionicons name="arrow-up" size={20} color={COLORS.textWhite} />
                <Text style={styles.sendButtonText}>Send Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  balanceCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  balanceUsd: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  amountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  currencyLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIcon: {
    fontSize: 18,
  },
  maxButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: 12,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.textWhite,
  },
  sendButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});
