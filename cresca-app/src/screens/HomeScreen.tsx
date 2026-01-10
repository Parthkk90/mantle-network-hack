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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>CRESCA</Text>
        <Text style={styles.address}>{formatAddress(address)}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{parseFloat(balance).toFixed(4)} MNT</Text>
        <Text style={styles.balanceUsd}>Mantle Sepolia Testnet</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {payments.sent.length === 0 && payments.received.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <>
            {payments.sent.slice(0, 5).map((payment) => (
              <View key={payment.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionIconText}>↑</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>Sent</Text>
                  <Text style={styles.transactionAddress}>
                    To: {formatAddress(payment.recipient)}
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
                  <Text style={styles.transactionType}>Received</Text>
                  <Text style={styles.transactionAddress}>
                    From: {formatAddress(payment.sender)}
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
        <Text style={styles.explorerButtonText}>View on Explorer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 24,
    padding: 32,
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  balanceUsd: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  historySection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconReceived: {
    backgroundColor: '#e8f5e9',
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  transactionAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 4,
  },
  transactionAmountReceived: {
    color: '#4caf50',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  explorerButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  explorerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
