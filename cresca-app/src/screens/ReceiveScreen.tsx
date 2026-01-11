import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from 'react-native';
import WalletService from '../services/WalletService';
import { COLORS } from '../theme/colors';

export default function ReceiveScreen({ navigation }: any) {
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    const addr = await WalletService.getAddress();
    setAddress(addr);
  };

  const handleCopyAddress = () => {
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send MNT to my CRESCA wallet:\n${address}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'<- BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'>> RECEIVE_PAYMENT'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>{'[ QR_CODE ]'}</Text>
          <Text style={styles.qrSubtext}>SCAN_TO_SEND_MNT</Text>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>{'>> YOUR_WALLET_ADDRESS'}</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
            <Text style={styles.actionButtonText}>{'[ COPY_ADDRESS ]'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>{'[ SHARE ]'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{'>> HOW_TO_RECEIVE'}</Text>
          <Text style={styles.infoText}>
            {'1. Share wallet address\n2. Wait for confirmation\n3. MNT appears in balance'}
          </Text>
        </View>

        <Text style={styles.networkInfo}>{'[MANTLE_SEPOLIA_TESTNET]'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
    padding: 24,
  },
  qrPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
    alignSelf: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  qrText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  qrSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  addressCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  addressText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareButton: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  networkInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
