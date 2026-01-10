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
        <Text style={styles.title}>Welcome to CRESCA</Text>
        <Text style={styles.subtitle}>Setup your wallet to get started</Text>

        {!showImport ? (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create New Wallet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowImport(true)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.label}>Private Key</Text>
            <TextInput
              style={styles.input}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="0x..."
              placeholderTextColor="#999"
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Import Wallet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowImport(false)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
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
    backgroundColor: '#fff',
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
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
  },
  content: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
