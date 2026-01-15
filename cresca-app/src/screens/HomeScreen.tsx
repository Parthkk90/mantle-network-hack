import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../hooks/useWallet';
import { 
  useTransactions, 
  Transaction as AppTransaction, 
  getTransactionIcon, 
  getStatusColor, 
  getTransactionTypeName 
} from '../context/TransactionContext';
import { useNetwork } from '../context/NetworkContext';
import { MANTLE_SEPOLIA } from '../config/constants';
import { COLORS } from '../theme/colors';
import { HomeScreenSkeleton } from '../components/Shimmer';
import AnimatedNumber from '../components/AnimatedNumber';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';

type FilterType = 'Latest' | 'Oldest' | 'This Week';

export default function HomeScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Latest');
  const [userName] = useState('Pascal');

  // Use network context for network switching
  const { network, isTestnet, toggleNetwork } = useNetwork();

  // Use wallet hook with 30-second polling for background refresh
  const { 
    data: walletData, 
    loading: walletLoading, 
    formattedBalance,
    shortAddress,
    refresh: refreshWallet 
  } = useWallet(30000);

  // Use transaction context
  const { transactions, refreshTransactions } = useTransactions();

  // Show shimmer during initial load only
  const isInitialLoading = walletLoading && !walletData;

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshWallet(), refreshTransactions()]);
  }, [refreshWallet, refreshTransactions]);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getFilteredTransactions = useCallback((): AppTransaction[] => {
    let filtered = [...transactions];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'Latest':
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'Oldest':
        filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'This Week':
        filtered = filtered.filter(t => new Date(t.timestamp) >= weekAgo);
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      default:
        break;
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered.slice(0, 15);
  }, [transactions, activeFilter]);

  const handleTransactionPress = (transaction: AppTransaction) => {
    navigation.navigate('TransactionDetails', { transaction });
  };

  const handleViewOnExplorer = async () => {
    const url = `${MANTLE_SEPOLIA.explorerUrl}/address/${walletData?.address}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening explorer:', error);
    }
  };

  // Show shimmer skeleton during initial load
  if (isInitialLoading) {
    return <HomeScreenSkeleton />;
  }

  const address = walletData?.address || '';
  const balance = walletData?.balance || '0';
  const usdBalance = (parseFloat(balance) * 1.8).toFixed(2);
  const filteredTransactions = getFilteredTransactions();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={walletLoading && !!walletData}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
          </View>
        </View>
        <TouchableOpacity style={styles.networkToggle} onPress={toggleNetwork}>
          <View style={[styles.networkDot, { backgroundColor: isTestnet ? COLORS.success : '#FF8C00' }]} />
          <Text style={styles.networkText}>{isTestnet ? 'Testnet' : 'Mainnet'}</Text>
          <Ionicons name="swap-horizontal" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <FadeInView delay={100}>
        <View style={styles.balanceSection}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
          </View>
          <AnimatedNumber 
            value={parseFloat(usdBalance)} 
            style={styles.balanceAmount}
            prefix="$"
            decimals={2}
          />
          <View style={styles.balanceDetails}>
            <AnimatedNumber 
              value={parseFloat(balance)} 
              style={styles.balanceMNT}
              suffix=" MNT"
              decimals={6}
            />
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.changeContainer}>
            <Ionicons name="trending-up" size={14} color={COLORS.success} />
            <Text style={styles.balanceChange}>1.44%</Text>
          </View>
        </View>
      </FadeInView>

      {/* Quick Actions */}
      <FadeInView delay={200}>
        <View style={styles.actionsRow}>
          <AnimatedPressable 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Send')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-up" size={20} color={COLORS.textWhite} />
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </AnimatedPressable>

          <AnimatedPressable 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Receive')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-down" size={20} color={COLORS.textWhite} />
            </View>
            <Text style={styles.actionLabel}>Receive</Text>
          </AnimatedPressable>

          <AnimatedPressable 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Swap')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="swap-horizontal" size={20} color={COLORS.textWhite} />
            </View>
            <Text style={styles.actionLabel}>Swap</Text>
          </AnimatedPressable>
        </View>
      </FadeInView>

      {/* Transaction History */}
      <FadeInView delay={300}>
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity onPress={refreshTransactions}>
              <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['Latest', 'Oldest', 'This Week'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.filterTabActive
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.filterTabTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction, index) => {
            const iconName = getTransactionIcon(transaction.type);
            const isSuccess = transaction.status === 'confirmed';
            const isFailed = transaction.status === 'failed';
            
            return (
              <FadeInView key={transaction.id} delay={350 + index * 50}>
                <AnimatedPressable 
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                >
                  <View style={styles.transactionIcon}>
                    <Ionicons 
                      name={iconName as any} 
                      size={16} 
                      color={COLORS.textMuted} 
                    />
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>
                      {getTransactionTypeName(transaction.type)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                      })} {new Date(transaction.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </Text>
                    {transaction.txHash && (
                      <Text style={styles.transactionHash} numberOfLines={1}>
                        {transaction.txHash.slice(0, 20)}...
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.transactionStatusContainer}>
                    {isSuccess ? (
                      <Ionicons name="checkmark" size={20} color={COLORS.success} />
                    ) : isFailed ? (
                      <Ionicons name="close" size={20} color={COLORS.error} />
                    ) : (
                      <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                    )}
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          })
        )}
        </View>
      </FadeInView>

      {/* View on Explorer */}
      <TouchableOpacity
        style={styles.explorerButton}
        onPress={handleViewOnExplorer}
      >
        <Ionicons name="open-outline" size={18} color={COLORS.primary} />
        <Text style={styles.explorerButtonText}>View Address on Explorer</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  networkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  balanceMNT: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  copyButton: {
    padding: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  balanceChange: {
    fontSize: 14,
    color: COLORS.accentGreen,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.text,
  },
  refreshIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  filterTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.textWhite,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  transactionIconReceived: {
    backgroundColor: '#E8F5E9',
  },
  transactionIconText: {
    fontSize: 18,
    color: COLORS.text,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  transactionHash: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  transactionStatusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  transactionStatus: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusSuccess: {
    color: COLORS.accentGreen,
  },
  statusFailed: {
    color: COLORS.accentRed,
  },
  explorerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 8,
  },
  explorerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  explorerArrow: {
    fontSize: 14,
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 100,
  },
});
