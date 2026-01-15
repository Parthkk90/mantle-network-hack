import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MANTLE_SEPOLIA, MANTLE_MAINNET, NetworkConfig } from '../config/constants';

interface NetworkContextType {
  network: NetworkConfig;
  isTestnet: boolean;
  toggleNetwork: () => Promise<void>;
  switchToTestnet: () => Promise<void>;
  switchToMainnet: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const NETWORK_STORAGE_KEY = '@cresca_network';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<NetworkConfig>(MANTLE_SEPOLIA);

  // Load saved network preference
  useEffect(() => {
    loadNetworkPreference();
  }, []);

  const loadNetworkPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(NETWORK_STORAGE_KEY);
      if (saved === 'mainnet') {
        setNetwork(MANTLE_MAINNET);
      } else {
        setNetwork(MANTLE_SEPOLIA);
      }
    } catch (error) {
      console.error('Error loading network preference:', error);
    }
  };

  const saveNetworkPreference = async (isMainnet: boolean) => {
    try {
      await AsyncStorage.setItem(NETWORK_STORAGE_KEY, isMainnet ? 'mainnet' : 'testnet');
    } catch (error) {
      console.error('Error saving network preference:', error);
    }
  };

  const toggleNetwork = useCallback(async () => {
    const newNetwork = network.isTestnet ? MANTLE_MAINNET : MANTLE_SEPOLIA;
    setNetwork(newNetwork);
    await saveNetworkPreference(!network.isTestnet);
  }, [network]);

  const switchToTestnet = useCallback(async () => {
    setNetwork(MANTLE_SEPOLIA);
    await saveNetworkPreference(false);
  }, []);

  const switchToMainnet = useCallback(async () => {
    setNetwork(MANTLE_MAINNET);
    await saveNetworkPreference(true);
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        network,
        isTestnet: network.isTestnet,
        toggleNetwork,
        switchToTestnet,
        switchToMainnet,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
