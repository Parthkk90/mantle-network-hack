import { useCallback, useMemo } from 'react';
import { useAsync, usePolling } from './useAsync';
import walletService from '../services/WalletService';

export interface WalletData {
  address: string;
  balance: string;
  hasWallet: boolean;
}

/**
 * Hook for wallet data with automatic refresh and polling
 */
export function useWallet(pollInterval?: number) {
  const fetchWalletData = useCallback(async (): Promise<WalletData> => {
    // Load wallet once, then get address and balance in parallel
    const wallet = await walletService.loadWallet();
    
    if (!wallet) {
      return {
        address: '',
        balance: '0',
        hasWallet: false,
      };
    }

    // Get address and balance in parallel
    const [address, balance] = await Promise.all([
      walletService.getAddress(),
      walletService.getBalance(),
    ]);

    return {
      address: address || '',
      balance: balance || '0',
      hasWallet: true,
    };
  }, []);

  const asyncResult = pollInterval 
    ? usePolling(fetchWalletData, pollInterval, true)
    : useAsync(fetchWalletData, true, 'wallet-data');

  // Memoize formatted values
  const formattedBalance = useMemo(() => {
    if (!asyncResult.data?.balance) return '0.00';
    const balance = parseFloat(asyncResult.data.balance);
    return balance.toFixed(4);
  }, [asyncResult.data?.balance]);

  const shortAddress = useMemo(() => {
    if (!asyncResult.data?.address) return '';
    const addr = asyncResult.data.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [asyncResult.data?.address]);

  return {
    ...asyncResult,
    formattedBalance,
    shortAddress,
  };
}

/**
 * Hook for creating a new wallet
 */
export function useCreateWallet() {
  const createWallet = useCallback(async () => {
    const wallet = await walletService.createWallet();
    return wallet;
  }, []);

  return useAsync(createWallet, false);
}

/**
 * Hook for importing wallet from mnemonic
 */
export function useImportWallet() {
  const importWallet = useCallback(async (mnemonic: string) => {
    const wallet = await walletService.importWallet(mnemonic);
    return wallet;
  }, []);

  return {
    importWallet,
    ...useAsync(async () => null, false),
  };
}
