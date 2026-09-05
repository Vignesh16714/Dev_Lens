import type { Storage } from './types';
import { FileStore } from './fileStore';

let _store: Storage | null = null;

/**
 * Returns the filesystem-based storage backend.
 */
export function getStore(): Storage {
  if (_store) return _store;
  _store = new FileStore();
  return _store;
}

export function resetStore(): void {
  _store = null;
}

export function cacheTtlMs(): number {
  const minutes = Number(process.env.CACHE_TTL_MINUTES ?? 120);
  const safe = Number.isFinite(minutes) && minutes >= 0 ? minutes : 120;
  return safe * 60 * 1000;
}

export * from './types';