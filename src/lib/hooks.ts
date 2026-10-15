'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api';

/** Loads data with loading/error state and a manual reload. Ignores stale responses. */
export function useFetch<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const result = await loaderRef.current();
      if (mine === seq.current) { setData(result); setError(null); }
    } catch (e) {
      if (mine === seq.current) setError(errorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void reload(); }, deps);

  return { data, error, loading, reload };
}

export function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Re-fetches when the tab regains focus and periodically while visible, so portal data never goes stale. */
export function useAutoRefresh(reload: () => void, intervalMs = 30_000) {
  const ref = useRef(reload);
  ref.current = reload;
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') ref.current(); };
    document.addEventListener('visibilitychange', tick);
    const timer = setInterval(tick, intervalMs);
    return () => { document.removeEventListener('visibilitychange', tick); clearInterval(timer); };
  }, [intervalMs]);
}
