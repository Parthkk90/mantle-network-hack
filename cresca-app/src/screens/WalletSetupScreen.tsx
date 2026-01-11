import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import WalletService from '../services/WalletService';
import { COLORS } from '../theme/colors';

export default function WalletSetupScreen({ onWalletReady }: { onWalletReady: () => void }) {
  const [loading, setLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    const hasWallet = await WalletService.hasWallet();
    if (hasWallet) {
      await WalletService.loadWallet();
      onWalletReady();
    }
  };

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const wallet = await WalletService.createWallet();
      Alert.alert(
        'Wallet Created',
        `Address: ${wallet.address}\n\nIMPORTANT: Save your private key securely!\n\nPrivate Key: ${wallet.privateKey}\n\nMnemonic: ${wallet.mnemonic}`,
        [
          {
            text: 'I have saved it',
            onPress: onWalletReady,
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter your private key');
      return;
    }

    setLoading(true);
    try {
      await WalletService.importWallet(privateKey.trim());
      Alert.alert('Success', 'Wallet imported successfully', [{ text: 'OK', onPress: onWalletReady }]);
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
        <Text style={styles.title}>{'> CRESCA_'}</Text>
        <Text style={styles.subtitle}>DECENTRALIZED_WALLET_PROTOCOL</Text>

        {!showImport ? (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.primaryButtonText}>{'[ CREATE_NEW_WALLET ]'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowImport(true)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>{'[ IMPORT_EXISTING_WALLET ]'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.label}>{'>> PRIVATE_KEY'}</Text>
            <TextInput
              style={styles.input}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="0x..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleImportWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.primaryButtonText}>{'[ IMPORT_WALLET ]'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowImport(false)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>{'<- BACK'}</Text>
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 48,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  content: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    fontSize: 13,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
    color: COLORS.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBackground,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
