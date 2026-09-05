// Storage abstraction for DevLens. Implementations can target the local
// filesystem (default, works out of the box) or a remote PostgreSQL/Supabase
// backend. This module must only ever be imported from server code.

export interface CachedAnalysis {
  username: string;
  canonicalUsername: string;
  payload: string; // JSON-serialized AnalyzeResponse payload (report + career)
  fetchedAt: string;
  etag: string | null;
}

export interface Storage {
  readonly kind: 'filesystem' | 'supabase';
  get(username: string): Promise<CachedAnalysis | null>;
  set(entry: CachedAnalysis): Promise<void>;
  has(username: string): Promise<boolean>;
  remove(username: string): Promise<void>;
}

export function analysisKey(username: string): string {
  return `analysis:${username.toLowerCase()}`;
}