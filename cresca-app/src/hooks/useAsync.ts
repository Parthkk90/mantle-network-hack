import { useState, useEffect, useCallback, useRef } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  state: LoadingState;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

/**
 * Generic async state hook for data fetching with proper loading states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  cacheKey?: string
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
    state: immediate ? 'loading' : 'idle',
  });

  const isMounted = useRef(true);
  const cache = useRef<Map<string, T>>(new Map());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    // Check cache first
    if (cacheKey && cache.current.has(cacheKey)) {
      setState({
        data: cache.current.get(cacheKey)!,
        loading: false,
        error: null,
        state: 'success',
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      state: 'loading',
    }));

    try {
      const result = await asyncFunction();
      
      if (!isMounted.current) return;

      // Cache the result
      if (cacheKey) {
        cache.current.set(cacheKey, result);
      }

      setState({
        data: result,
        loading: false,
        error: null,
        state: 'success',
      });
    } catch (error) {
      if (!isMounted.current) return;

      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        state: 'error',
      });
    }
  }, [asyncFunction, cacheKey]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      state: 'idle',
    });
  }, []);

  const refresh = useCallback(async () => {
    // Clear cache and re-fetch
    if (cacheKey) {
      cache.current.delete(cacheKey);
    }
    await execute();
  }, [cacheKey, execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    reset,
    refresh,
  };
}

/**
 * Hook for managing multiple async operations in parallel
 */
export function useParallelAsync<T extends Record<string, () => Promise<any>>>(
  asyncFunctions: T,
  immediate = true
): {
  data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
  loading: boolean;
  errors: { [K in keyof T]: Error | null };
  execute: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const keys = Object.keys(asyncFunctions) as (keyof T)[];
  
  const [data, setData] = useState<{ [K in keyof T]: any }>(() => {
    const initial: any = {};
    keys.forEach((key) => {
      initial[key] = null;
    });
    return initial;
  });

  const [loading, setLoading] = useState(immediate);
  
  const [errors, setErrors] = useState<{ [K in keyof T]: Error | null }>(() => {
    const initial: any = {};
    keys.forEach((key) => {
      initial[key] = null;
    });
    return initial;
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setLoading(true);
    
    const results = await Promise.allSettled(
      keys.map((key) => asyncFunctions[key]())
    );

    if (!isMounted.current) return;

    const newData: any = {};
    const newErrors: any = {};

    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') {
        newData[key] = result.value;
        newErrors[key] = null;
      } else {
        newData[key] = null;
        newErrors[key] = result.reason instanceof Error 
          ? result.reason 
          : new Error(String(result.reason));
      }
    });

    setData(newData);
    setErrors(newErrors);
    setLoading(false);
  }, [asyncFunctions, keys]);

  const refresh = useCallback(async () => {
    await execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return {
    data,
    loading,
    errors,
    execute,
    refresh,
  };
}

/**
 * Hook for debounced async operations (useful for search)
 */
export function useDebouncedAsync<T>(
  asyncFunction: () => Promise<T>,
  delay: number = 300,
  deps: any[] = []
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    state: 'idle',
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      state: 'loading',
    }));

    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await asyncFunction();
        
        if (!isMounted.current) return;

        setState({
          data: result,
          loading: false,
          error: null,
          state: 'success',
        });
      } catch (error) {
        if (!isMounted.current) return;

        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
          state: 'error',
        });
      }
    }, delay);
  }, [asyncFunction, delay, ...deps]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      data: null,
      loading: false,
      error: null,
      state: 'idle',
    });
  }, []);

  const refresh = useCallback(async () => {
    await execute();
  }, [execute]);

  return {
    ...state,
    execute,
    reset,
    refresh,
  };
}

/**
 * Hook for polling data at intervals
 */
export function usePolling<T>(
  asyncFunction: () => Promise<T>,
  interval: number = 30000, // 30 seconds default
  immediate = true
): UseAsyncReturn<T> & { isPolling: boolean; startPolling: () => void; stopPolling: () => void } {
  const asyncState = useAsync(asyncFunction, immediate);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      asyncState.execute();
    }, interval);
  }, [asyncState.execute, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...asyncState,
    isPolling,
    startPolling,
    stopPolling,
  };
}
