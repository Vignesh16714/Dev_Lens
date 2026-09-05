import type { AnalyzeResponse } from '@/lib/types';

const PREFIX = 'devlens:analysis:';

export function analysisStorageKey(username: string): string {
  return `${PREFIX}${username.toLowerCase()}`;
}

export function saveAnalysis(username: string, resp: AnalyzeResponse): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(analysisStorageKey(username), JSON.stringify(resp));
  } catch {
    // storage full / unavailable — ignore
  }
}

export function loadAnalysis(username: string): AnalyzeResponse | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(analysisStorageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalyzeResponse;
    return parsed.ok ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAnalysis(username: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(analysisStorageKey(username));
  } catch {
    /* ignore */
  }
}

/** Results are read-only snapshots; persist under this file for reuse. */
export { analysisStorageKey as _analysisStorageKey };