import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'bundle_investment' | 'rwa_investment';
  status: 'pending' | 'confirmed' | 'failed';
  txHash: string;
  amount: string;
  token: string;
  timestamp: Date;
  from?: string;
  to?: string;
  // For swaps
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  // For investments
  bundleName?: string;
  assetName?: string;
  leverage?: number;
  position?: 'long' | 'short';
  // Block info
  blockNumber?: number;
  gasUsed?: string;
  // Mantle specific
  explorerUrl: string;
  // Additional metadata for custom data
  metadata?: Record<string, any>;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'explorerUrl'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  clearTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const STORAGE_KEY = 'cresca_transactions';
const EXPLORER_BASE_URL = 'https://sepolia.mantlescan.xyz';

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from storage on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const txs = parsed.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const saveTransactions = async (txs: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'timestamp' | 'explorerUrl'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      explorerUrl: `${EXPLORER_BASE_URL}/tx/${tx.txHash}`,
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      );
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(tx => tx.id === id);
  }, [transactions]);

  const clearTransactions = useCallback(async () => {
    setTransactions([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshTransactions = useCallback(async () => {
    await loadTransactions();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        getTransactionById,
        clearTransactions,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

// Helper function to get transaction type display name
export function getTransactionTypeName(type: Transaction['type']): string {
  switch (type) {
    case 'send':
      return 'Sent';
    case 'receive':
      return 'Received';
    case 'swap':
      return 'Swap';
    case 'bundle_investment':
      return 'Bundle Investment';
    case 'rwa_investment':
      return 'RWA Investment';
    default:
      return 'Transaction';
  }
}

// Helper function to get transaction icon name
export function getTransactionIcon(type: Transaction['type']): string {
  switch (type) {
    case 'send':
      return 'arrow-up';
    case 'receive':
      return 'arrow-down';
    case 'swap':
      return 'swap-horizontal';
    case 'bundle_investment':
      return 'cube';
    case 'rwa_investment':
      return 'business';
    default:
      return 'document';
  }
}

// Helper function to get status color
export function getStatusColor(status: Transaction['status']): string {
  switch (status) {
    case 'confirmed':
      return '#22C55E';
    case 'pending':
      return '#F59E0B';
    case 'failed':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}
