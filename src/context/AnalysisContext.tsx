'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AnalyzeResponse } from '@/lib/types';
import { loadAnalysis, saveAnalysis, clearAnalysis } from '@/lib/client-storage';

type Status = 'loading' | 'ready' | 'error';

interface AnalysisCtx {
  status: Status;
  data: AnalyzeResponse | null;
  error: string | null;
  sourceLabel: string;
  refresh: () => Promise<void>;
  clearLocal: () => void;
  username: string | null;
}

const Ctx = createContext<AnalysisCtx | null>(null);

export function useAnalysis(): AnalysisCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}

export function sourceLabel(source: string): string {
  if (source === 'github') return 'Live GitHub data';
  if (source === 'mock') return 'Demo data · GitHub API unavailable';
  if (source === 'cache') return 'Cached result';
  return 'Data';
}

/**
 * Holds a single loaded analysis. `username` is the requested canonical login;
 * the provider hydrates from localStorage first, then fetches from the
 * share endpoint so a deep link always resolves.
 */
export function AnalysisProvider({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const cached = loadAnalysis(username);
    if (cached) {
      setData(cached);
      setStatus('ready');
      return;
    }
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(username)}`);
      const resp = (await res.json()) as AnalyzeResponse;
      if (resp.ok && resp.report) {
        setData(resp);
        saveAnalysis(username, resp);
        setStatus('ready');
      } else {
        setData(null);
        setError(resp.error ?? 'No analysis available for this profile.');
        setStatus('error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: username }),
      });
      const resp = (await res.json()) as AnalyzeResponse;
      if (resp.ok && resp.report) {
        setData(resp);
        saveAnalysis(resp.requestedUsername ?? username, resp);
        setStatus('ready');
      } else {
        setData(null);
        setError(resp.error ?? 'Refresh failed.');
        setStatus('error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, data?.requestedUsername]);

  const clearLocal = useCallback(() => {
    clearAnalysis(username);
    setData(null);
  }, [username]);

  const value = useMemo<AnalysisCtx>(
    () => ({
      status,
      data,
      error,
      sourceLabel: data ? sourceLabel(data.source) : 'Loading…',
      refresh,
      clearLocal,
      username: data?.requestedUsername ?? username,
    }),
    [status, data, error, refresh, clearLocal, username]
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { loadAnalysis };