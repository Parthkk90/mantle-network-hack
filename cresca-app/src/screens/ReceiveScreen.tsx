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
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import WalletService from '../services/WalletService';
import { COLORS } from '../theme/colors';
import QRCode from '../components/QRCode';

export default function ReceiveScreen({ navigation }: any) {
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    const addr = await WalletService.getAddress();
    setAddress(addr);
  };

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied!', 'Address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send crypto to my wallet:\n${address}`,
        title: 'My Wallet Address',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrContainer}>
            {address ? (
              <QRCode 
                value={address} 
                size={180} 
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <View style={styles.qrLoading}>
                <Ionicons name="qr-code" size={48} color={COLORS.primary} />
                <Text style={styles.qrLoadingText}>Loading...</Text>
              </View>
            )}
          </View>
          
          {/* Address Display */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Your Wallet Address</Text>
            <Text style={styles.addressText}>
              {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : 'Loading...'}
            </Text>
          </View>
          
          <Text style={styles.qrDescription}>
            Scan this QR code to receive crypto to your wallet
          </Text>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={COLORS.primary} />
            <Text style={styles.shareText}>Share Address</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copy Address Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Ionicons name="copy-outline" size={20} color={COLORS.textWhite} />
          <Text style={styles.copyButtonText}>Copy Address</Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  qrLoading: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  qrLoadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  shareText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
});
