import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import WalletService from '../services/WalletService';

interface AuthContextType {
  isWalletReady: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkWallet = useCallback(async () => {
    try {
      setLoading(true);
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const checkPromise = WalletService.hasWallet();
      
      const hasWallet = await Promise.race([checkPromise, timeoutPromise]) as boolean;
      
      if (hasWallet) {
        try {
          await WalletService.loadWallet();
          setIsWalletReady(true);
        } catch (loadError) {
          console.error('Wallet load error:', loadError);
          // Wallet exists but can't load - clear it and show setup
          setIsWalletReady(false);
        }
      } else {
        setIsWalletReady(false);
      }
    } catch (error) {
      console.error('Wallet check error:', error);
      // On timeout or error, assume no wallet and show setup
      setIsWalletReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkWallet();
  }, [checkWallet]);

  const login = useCallback(() => {
    setIsWalletReady(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Delete wallet from secure storage
      await WalletService.deleteWallet();
      // Reset wallet ready state
      setIsWalletReady(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if delete fails, reset the state
      setIsWalletReady(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isWalletReady, loading, login, logout, checkWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
