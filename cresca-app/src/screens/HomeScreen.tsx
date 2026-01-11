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
import WalletService from '../services/WalletService';
import PaymentService from '../services/PaymentService';
import { MANTLE_SEPOLIA } from '../config/constants';
import { COLORS } from '../theme/colors';

export default function HomeScreen({ navigation }: any) {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const addr = await WalletService.getAddress();
      setAddress(addr);
      
      const bal = await WalletService.getBalance();
      setBalance(bal);
      
      try {
        const history = await PaymentService.getPaymentHistory(addr);
        setPayments(history);
      } catch (historyError) {
        console.log('Could not load payment history');
        setPayments({ sent: [], received: [] });
      }
    } catch (error) {
      console.error('Load wallet error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.headerSection}>
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>MANTLE_TESTNET</Text>
        </View>
        
        <Text style={styles.balanceLabel}>TOTAL_BALANCE</Text>
        <Text style={styles.balanceAmount}>${(parseFloat(balance) * 10).toFixed(2)}</Text>
        
        <View style={styles.balanceDetails}>
          <Text style={styles.balanceMNT}>{parseFloat(balance).toFixed(6)} MNT</Text>
          <Text style={styles.balanceChange}>↗ +1.44%</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionCircle}
          onPress={() => navigation.navigate('Send')}
        >
          <View style={styles.circleButton}>
            <Text style={styles.circleIcon}>↑</Text>
          </View>
          <Text style={styles.circleLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCircle}
          onPress={() => navigation.navigate('Receive')}
        >
          <View style={styles.circleButton}>
            <Text style={styles.circleIcon}>↓</Text>
          </View>
          <Text style={styles.circleLabel}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCircle}
          onPress={() => navigation.navigate('MarketsTab')}
        >
          <View style={styles.circleButton}>
            <Text style={styles.circleIcon}>⇄</Text>
          </View>
          <Text style={styles.circleLabel}>Swap</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>{'>> RECENT_ACTIVITY'}</Text>
        
        {payments.sent.length === 0 && payments.received.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{'[NO_TRANSACTIONS_FOUND]'}</Text>
          </View>
        ) : (
          <>
            {payments.sent.slice(0, 5).map((payment) => (
              <View key={payment.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionIconText}>↑</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>SENT</Text>
                  <Text style={styles.transactionAddress}>
                    {formatAddress(payment.recipient)}
                  </Text>
                  <Text style={styles.transactionNote}>{payment.note}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.transactionAmountText}>
                    -{parseFloat(payment.amount).toFixed(4)} MNT
                  </Text>
                  <Text style={styles.transactionDate}>
                    {payment.timestamp.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}

            {payments.received.slice(0, 5).map((payment) => (
              <View key={payment.id} style={styles.transactionItem}>
                <View style={[styles.transactionIcon, styles.transactionIconReceived]}>
                  <Text style={styles.transactionIconText}>↓</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>RECEIVED</Text>
                  <Text style={styles.transactionAddress}>
                    {formatAddress(payment.sender)}
                  </Text>
                  <Text style={styles.transactionNote}>{payment.note}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[styles.transactionAmountText, styles.transactionAmountReceived]}>
                    +{parseFloat(payment.amount).toFixed(4)} MNT
                  </Text>
                  <Text style={styles.transactionDate}>
                    {payment.timestamp.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.explorerButton}
        onPress={() => {
          console.log(`${MANTLE_SEPOLIA.explorerUrl}/address/${address}`);
        }}
      >
        <Text style={styles.explorerButtonText}>{'[ VIEW_ON_EXPLORER ]'}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  networkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceMNT: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  balanceChange: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  actionCircle: {
    alignItems: 'center',
  },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  circleIcon: {
    fontSize: 32,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  circleLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  historySection: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconReceived: {
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    borderColor: COLORS.primary,
  },
  transactionIconText: {
    fontSize: 20,
    color: COLORS.textWhite,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  transactionAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  transactionNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  transactionAmountReceived: {
    color: COLORS.primary,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  explorerButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  explorerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
