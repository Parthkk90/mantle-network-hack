import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Asset {
  id: string;
  name: string;
  type: 'crypto' | 'rwa';
  allocation: string;
}

const AVAILABLE_ASSETS = [
  { id: 'btc', name: 'Bitcoin (BTC)', type: 'crypto' },
  { id: 'eth', name: 'Ethereum (ETH)', type: 'crypto' },
  { id: 'mnt', name: 'Mantle (MNT)', type: 'crypto' },
  { id: 'usdc', name: 'USD Coin (USDC)', type: 'crypto' },
  { id: 'usdt', name: 'Tether (USDT)', type: 'crypto' },
  { id: 'invoice', name: 'Invoice Factoring', type: 'rwa' },
  { id: 'supply', name: 'Supply Chain Finance', type: 'rwa' },
  { id: 'realestate', name: 'Real Estate Tokens', type: 'rwa' },
  { id: 'trade', name: 'Trade Finance', type: 'rwa' },
];

export default function CreateBundleScreen({ navigation }: any) {
  const [bundleName, setBundleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAsset = (asset: any) => {
    if (selectedAssets.find(a => a.id === asset.id)) {
      Alert.alert('Already Added', 'This asset is already in your bundle');
      return;
    }
    
    setSelectedAssets([...selectedAssets, { ...asset, allocation: '0' }]);
    setShowAssetPicker(false);
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssets(selectedAssets.filter(a => a.id !== assetId));
  };

  const updateAllocation = (assetId: string, allocation: string) => {
    setSelectedAssets(
      selectedAssets.map(a => 
        a.id === assetId ? { ...a, allocation } : a
      )
    );
  };

  const getTotalAllocation = () => {
    return selectedAssets.reduce((sum, asset) => sum + parseFloat(asset.allocation || '0'), 0);
  };

  const handleCreate = async () => {
    if (!bundleName.trim()) {
      Alert.alert('Missing Name', 'Please enter a bundle name');
      return;
    }

    if (selectedAssets.length < 2) {
      Alert.alert('Not Enough Assets', 'Please add at least 2 assets to your bundle');
      return;
    }

    const totalAllocation = getTotalAllocation();
    if (Math.abs(totalAllocation - 100) > 0.01) {
      Alert.alert('Invalid Allocation', `Total allocation must be 100%. Current: ${totalAllocation.toFixed(2)}%`);
      return;
    }

    Alert.alert(
      'Create Bundle',
      `Create "${bundleName}" with ${selectedAssets.length} assets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create', onPress: executeCreate },
      ]
    );
  };

  const executeCreate = async () => {
    setLoading(true);
    try {
      // In production, this would call the Bundle Factory contract
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Bundle Created!',
        `${bundleName} has been created successfully`,
        [
          {
            text: 'View Bundles',
            onPress: () => navigation.navigate('Bundles'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Creation Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const totalAllocation = getTotalAllocation();
  const cryptoAllocation = selectedAssets
    .filter(a => a.type === 'crypto')
    .reduce((sum, a) => sum + parseFloat(a.allocation || '0'), 0);
  const rwaAllocation = selectedAssets
    .filter(a => a.type === 'rwa')
    .reduce((sum, a) => sum + parseFloat(a.allocation || '0'), 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Create Bundle</Text>
          <Text style={styles.subtitle}>Build your custom investment portfolio</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bundle Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Balanced Portfolio"
            value={bundleName}
            onChangeText={setBundleName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your bundle strategy..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Assets ({selectedAssets.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAssetPicker(!showAssetPicker)}
            >
              <Text style={styles.addButtonText}>+ Add Asset</Text>
            </TouchableOpacity>
          </View>

          {showAssetPicker && (
            <View style={styles.assetPicker}>
              {AVAILABLE_ASSETS.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.assetOption}
                  onPress={() => addAsset(asset)}
                >
                  <Text style={styles.assetOptionName}>{asset.name}</Text>
                  <View style={[
                    styles.assetTypeBadge,
                    asset.type === 'crypto' ? styles.cryptoBadge : styles.rwaBadge
                  ]}>
                    <Text style={styles.assetTypeText}>
                      {asset.type === 'crypto' ? 'CRYPTO' : 'RWA'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedAssets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No assets added yet</Text>
            </View>
          ) : (
            <View style={styles.assetsList}>
              {selectedAssets.map((asset) => (
                <View key={asset.id} style={styles.assetItem}>
                  <View style={styles.assetItemHeader}>
                    <Text style={styles.assetItemName}>{asset.name}</Text>
                    <TouchableOpacity onPress={() => removeAsset(asset.id)}>
                      <Text style={styles.removeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.allocationInput}>
                    <TextInput
                      style={styles.allocationField}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      value={asset.allocation}
                      onChangeText={(value) => updateAllocation(asset.id, value)}
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {selectedAssets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Allocation Summary</Text>
            
            <View style={styles.allocationBar}>
              {cryptoAllocation > 0 && (
                <View
                  style={[
                    styles.allocationSegment,
                    { width: `${cryptoAllocation}%`, backgroundColor: '#007AFF' },
                  ]}
                />
              )}
              {rwaAllocation > 0 && (
                <View
                  style={[
                    styles.allocationSegment,
                    { width: `${rwaAllocation}%`, backgroundColor: '#34C759' },
                  ]}
                />
              )}
            </View>

            <View style={styles.allocationDetails}>
              <View style={styles.allocationRow}>
                <View style={[styles.dot, { backgroundColor: '#007AFF' }]} />
                <Text style={styles.allocationLabel}>Cryptocurrency</Text>
                <Text style={styles.allocationValue}>{cryptoAllocation.toFixed(2)}%</Text>
              </View>
              <View style={styles.allocationRow}>
                <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.allocationLabel}>Real World Assets</Text>
                <Text style={styles.allocationValue}>{rwaAllocation.toFixed(2)}%</Text>
              </View>
            </View>

            <View style={[
              styles.totalAllocation,
              Math.abs(totalAllocation - 100) < 0.01 ? styles.totalValid : styles.totalInvalid
            ]}>
              <Text style={styles.totalLabel}>Total Allocation</Text>
              <Text style={styles.totalValue}>{totalAllocation.toFixed(2)}%</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, (loading || Math.abs(totalAllocation - 100) > 0.01 || selectedAssets.length < 2) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading || Math.abs(totalAllocation - 100) > 0.01 || selectedAssets.length < 2}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Bundle'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  assetPicker: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  assetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  assetOptionName: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  assetTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cryptoBadge: {
    backgroundColor: '#e3f2fd',
  },
  rwaBadge: {
    backgroundColor: '#e8f5e9',
  },
  assetTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  assetsList: {
  },
  assetItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  assetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  removeButton: {
    fontSize: 20,
    color: '#f44336',
  },
  allocationInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  percentSign: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  allocationBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
  },
  allocationSegment: {
    height: '100%',
  },
  allocationDetails: {
    marginBottom: 16,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  allocationLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalAllocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  totalValid: {
    backgroundColor: '#e8f5e9',
  },
  totalInvalid: {
    backgroundColor: '#ffebee',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  createButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
