import { useCallback, useMemo } from 'react';
import { useAsync, usePolling } from './useAsync';
import { bundleService, Bundle } from '../services/BundleService';

// Mock data for when blockchain bundles aren't available
const MOCK_BUNDLES: Bundle[] = [
  {
    id: 'mock-1',
    address: '0x0000000000000000000000000000000000000001',
    name: 'DeFi Blue Chips',
    symbol: 'DEFI',
    apy: '12.5',
    tvl: '1,250,000',
    tokens: ['WETH', 'WBTC', 'MNT'],
    weights: [40, 35, 25],
    composition: '40% WETH, 35% WBTC, 25% MNT',
    creator: '0x0000000000000000000000000000000000000000',
    isActive: true,
    isMock: true,
  },
  {
    id: 'mock-2',
    address: '0x0000000000000000000000000000000000000002',
    name: 'Stablecoin Yield',
    symbol: 'STABLE',
    apy: '8.2',
    tvl: '3,500,000',
    tokens: ['USDC', 'USDT'],
    weights: [50, 50],
    composition: '50% USDC, 50% USDT',
    creator: '0x0000000000000000000000000000000000000000',
    isActive: true,
    isMock: true,
  },
  {
    id: 'mock-3',
    address: '0x0000000000000000000000000000000000000003',
    name: 'High Yield Growth',
    symbol: 'YIELD',
    apy: '24.8',
    tvl: '890,000',
    tokens: ['MNT', 'WETH'],
    weights: [60, 40],
    composition: '60% MNT, 40% WETH',
    creator: '0x0000000000000000000000000000000000000000',
    isActive: true,
    isMock: true,
  },
  {
    id: 'mock-4',
    address: '0x0000000000000000000000000000000000000004',
    name: 'Liquidity Provider Index',
    symbol: 'LPIDX',
    apy: '18.5',
    tvl: '560,000',
    tokens: ['WETH', 'MNT', 'USDC'],
    weights: [50, 30, 20],
    composition: '50% WETH, 30% MNT, 20% USDC',
    creator: '0x0000000000000000000000000000000000000000',
    isActive: true,
    isMock: true,
  },
];

// Category definitions
export const BUNDLE_CATEGORIES = ['All', 'Popular', 'DeFi', 'Yield', 'Stablecoins'] as const;
export type BundleCategory = (typeof BUNDLE_CATEGORIES)[number];

// Risk level type
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Determine risk level based on APY
 */
export function getRiskLevel(apy: string): RiskLevel {
  const apyNum = parseFloat(apy);
  if (apyNum < 10) return 'Low';
  if (apyNum < 20) return 'Medium';
  return 'High';
}

/**
 * Filter bundles by category
 */
export function filterByCategory(bundles: Bundle[], category: BundleCategory): Bundle[] {
  if (category === 'All') return bundles;
  
  return bundles.filter((bundle) => {
    const lowerName = bundle.name.toLowerCase();
    switch (category) {
      case 'Popular':
        return parseFloat(bundle.tvl.replace(/,/g, '')) > 500000;
      case 'DeFi':
        return lowerName.includes('defi') || lowerName.includes('liquidity') || lowerName.includes('swap');
      case 'Yield':
        return lowerName.includes('yield') || lowerName.includes('apy') || parseFloat(bundle.apy) > 10;
      case 'Stablecoins':
        return lowerName.includes('stable') || lowerName.includes('usdc') || lowerName.includes('usdt');
      default:
        return true;
    }
  });
}

/**
 * Hook for fetching all bundles with automatic caching and refresh
 */
export function useBundles(pollInterval?: number) {
  const fetchBundles = useCallback(async (): Promise<Bundle[]> => {
    try {
      const bundles = await bundleService.getAllBundles();
      
      // If no real bundles, return mock data for demo
      if (bundles.length === 0) {
        return MOCK_BUNDLES;
      }
      
      return bundles;
    } catch (error) {
      console.error('Error fetching bundles:', error);
      // Return mock data on error
      return MOCK_BUNDLES;
    }
  }, []);

  const asyncResult = pollInterval
    ? usePolling(fetchBundles, pollInterval, true)
    : useAsync(fetchBundles, true, 'all-bundles');

  return asyncResult;
}

/**
 * Hook for fetching bundles filtered by category
 */
export function useBundlesByCategory(category: BundleCategory) {
  const { data: allBundles, loading, error, refresh } = useBundles();

  const filteredBundles = useMemo(() => {
    if (!allBundles) return [];
    return filterByCategory(allBundles, category);
  }, [allBundles, category]);

  return {
    data: filteredBundles,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for fetching user's investments
 */
export function useUserInvestments() {
  const fetchInvestments = useCallback(async (): Promise<Bundle[]> => {
    return bundleService.getUserInvestments();
  }, []);

  return useAsync(fetchInvestments, true, 'user-investments');
}

/**
 * Hook for fetching a single bundle by address
 */
export function useBundle(bundleAddress: string) {
  const fetchBundle = useCallback(async (): Promise<Bundle | null> => {
    const bundles = await bundleService.getAllBundles();
    return bundles.find((b) => b.address === bundleAddress) || null;
  }, [bundleAddress]);

  return useAsync(fetchBundle, true, `bundle-${bundleAddress}`);
}

/**
 * Hook for investing in a bundle
 */
export function useInvestInBundle() {
  const invest = useCallback(
    async (params: {
      bundleAddress: string;
      amount: string;
      leverage?: number;
      position?: 'long' | 'short';
    }) => {
      const { bundleAddress, amount, leverage = 1, position = 'long' } = params;
      return bundleService.investInBundle(bundleAddress, amount, leverage, position);
    },
    []
  );

  return useAsync(async () => null, false);
}
