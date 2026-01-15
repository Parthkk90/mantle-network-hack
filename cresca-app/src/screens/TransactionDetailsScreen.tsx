import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { 
  Transaction, 
  getTransactionTypeName, 
  getTransactionIcon, 
  getStatusColor 
} from '../context/TransactionContext';

export default function TransactionDetailsScreen({ route, navigation }: any) {
  const { transaction } = route.params as { transaction: Transaction };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 14)}...${hash.slice(-10)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleViewOnExplorer = async () => {
    try {
      const supported = await Linking.canOpenURL(transaction.explorerUrl);
      if (supported) {
        await Linking.openURL(transaction.explorerUrl);
      } else {
        Alert.alert('Error', 'Unable to open explorer URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open browser');
    }
  };

  const handleCopyHash = () => {
    // In a real app, you'd use Clipboard.setString
    Alert.alert('Copied', 'Transaction hash copied to clipboard');
  };

  const statusColor = getStatusColor(transaction.status);
  const iconName = getTransactionIcon(transaction.type);

  const renderTransactionDetails = () => {
    switch (transaction.type) {
      case 'send':
        return (
          <>
            <DetailRow label="To Address" value={formatAddress(transaction.to || '')} />
            <DetailRow label="Amount" value={`${transaction.amount} ${transaction.token}`} />
          </>
        );
      case 'receive':
        return (
          <>
            <DetailRow label="From Address" value={formatAddress(transaction.from || '')} />
            <DetailRow label="Amount" value={`${transaction.amount} ${transaction.token}`} />
          </>
        );
      case 'swap':
        return (
          <>
            <DetailRow label="From" value={`${transaction.fromAmount} ${transaction.fromToken}`} />
            <DetailRow label="To" value={`${transaction.toAmount} ${transaction.toToken}`} />
          </>
        );
      case 'bundle_investment':
        return (
          <>
            <DetailRow label="Bundle" value={transaction.bundleName || 'N/A'} />
            <DetailRow label="Amount" value={`${transaction.amount} ${transaction.token}`} />
            {transaction.leverage && (
              <DetailRow label="Leverage" value={`${transaction.leverage}x`} />
            )}
            {transaction.position && (
              <DetailRow label="Position" value={transaction.position.toUpperCase()} />
            )}
          </>
        );
      case 'rwa_investment':
        return (
          <>
            <DetailRow label="Asset" value={transaction.assetName || 'N/A'} />
            <DetailRow label="Amount" value={`${transaction.amount} ${transaction.token}`} />
          </>
        );
      default:
        return (
          <DetailRow label="Amount" value={`${transaction.amount} ${transaction.token}`} />
        );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Transaction Type Card */}
      <View style={styles.typeCard}>
        <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name={iconName as any} size={32} color={statusColor} />
        </View>
        <Text style={styles.typeName}>{getTransactionTypeName(transaction.type)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        {transaction.type === 'swap' ? (
          <>
            <Text style={styles.swapAmount}>
              {transaction.fromAmount} {transaction.fromToken}
            </Text>
            <Ionicons name="arrow-forward" size={24} color={COLORS.textMuted} />
            <Text style={styles.swapAmount}>
              {transaction.toAmount} {transaction.toToken}
            </Text>
          </>
        ) : (
          <Text style={styles.mainAmount}>
            {transaction.type === 'send' ? '-' : '+'}{transaction.amount} {transaction.token}
          </Text>
        )}
      </View>

      {/* Transaction Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Transaction Information</Text>
        
        {renderTransactionDetails()}
        
        <View style={styles.divider} />
        
        <DetailRow label="Date & Time" value={formatDate(new Date(transaction.timestamp))} />
        
        <View style={styles.hashRow}>
          <Text style={styles.detailLabel}>Transaction Hash</Text>
          <View style={styles.hashValueContainer}>
            <Text style={styles.hashValue}>{formatHash(transaction.txHash)}</Text>
            <TouchableOpacity onPress={handleCopyHash} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {transaction.blockNumber && (
          <DetailRow label="Block Number" value={transaction.blockNumber.toString()} />
        )}
        
        {transaction.gasUsed && (
          <DetailRow label="Gas Used" value={transaction.gasUsed} />
        )}
      </View>

      {/* Network Info */}
      <View style={styles.networkCard}>
        <View style={styles.networkHeader}>
          <View style={styles.networkIcon}>
            <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.networkName}>Mantle Sepolia Testnet</Text>
        </View>
        <Text style={styles.networkDescription}>
          This transaction was executed on the Mantle Sepolia testnet.
        </Text>
      </View>

      {/* View on Explorer Button */}
      <TouchableOpacity style={styles.explorerButton} onPress={handleViewOnExplorer}>
        <Ionicons name="open-outline" size={20} color={COLORS.textWhite} />
        <Text style={styles.explorerButtonText}>View on Mantle Explorer</Text>
      </TouchableOpacity>

      {/* Explorer URL Display */}
      <View style={styles.urlContainer}>
        <Text style={styles.urlLabel}>Explorer URL:</Text>
        <Text style={styles.urlText} numberOfLines={2}>
          {transaction.explorerUrl}
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  typeCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  swapAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  hashRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  hashValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  hashValue: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.text,
  },
  copyButton: {
    padding: 4,
  },
  networkCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  networkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  networkDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  explorerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  explorerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  urlContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urlLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bottomSpacer: {
    height: 40,
  },
});
