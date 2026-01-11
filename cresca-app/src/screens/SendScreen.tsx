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
} from 'react-native';
import PaymentService from '../services/PaymentService';
import WalletService from '../services/WalletService';
import { MANTLE_SEPOLIA } from '../config/constants';
import { COLORS } from '../theme/colors';

export default function SendScreen({ navigation }: any) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');

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

    Alert.alert('Confirm Transaction', `Send ${amount} MNT to ${recipient}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: executeSend },
    ]);
  };

  const executeSend = async () => {
    setLoading(true);

    try {
      const result = await PaymentService.sendMNT({
        recipient,
        amount,
        note: note || 'Payment via CRESCA',
      });

      if (result.success) {
        Alert.alert(
          'Success',
          `Payment sent successfully!\n\nTransaction: ${result.transactionHash?.slice(0, 10)}...`,
          [
            {
              text: 'View on Explorer',
              onPress: () => {
                console.log(`${MANTLE_SEPOLIA.explorerUrl}/tx/${result.transactionHash}`);
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
          <Text style={styles.title}>{'>> SEND_PAYMENT'}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{'[AVAILABLE_BALANCE]'}</Text>
          <Text style={styles.balanceAmount}>{balance} MNT</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{'>> RECIPIENT_ADDRESS'}</Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{'>> AMOUNT (MNT)'}</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setAmount(balance)}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{'>> NOTE (OPTIONAL)'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Payment for..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.sendButtonText}>{'[ SEND_PAYMENT ]'}</Text>
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
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: COLORS.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  maxButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  maxButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
