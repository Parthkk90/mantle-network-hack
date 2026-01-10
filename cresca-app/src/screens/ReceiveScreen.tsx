import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import WalletService from '../services/WalletService';

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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Receive Payment</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR Code</Text>
          <Text style={styles.qrSubtext}>Scan to send MNT</Text>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Your Wallet Address</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
            <Text style={styles.actionButtonText}>Copy Address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to receive MNT?</Text>
          <Text style={styles.infoText}>
            1. Share your wallet address with the sender{'\n'}
            2. Or let them scan your QR code{'\n'}
            3. Wait for the transaction to confirm{'\n'}
            4. MNT will appear in your balance
          </Text>
        </View>

        <Text style={styles.networkInfo}>Network: Mantle Sepolia Testnet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#666',
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  shareButton: {
    backgroundColor: '#34c759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  networkInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
});
