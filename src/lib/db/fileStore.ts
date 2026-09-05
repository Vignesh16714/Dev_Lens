import { promises as fs } from 'fs';
import path from 'path';
import type { CachedAnalysis, Storage } from './types';

/**
 * A simple on-disk JSON cache used whenever no external database is
 * configured. Files are stored under `<project>/.devlens-cache/`. This keeps
 * the app fully functional out of the box while still satisfying the
 * "cache for persistence" requirement. Swap for a Postgres/Supabase store in
 * production via the Storage interface.
 */
export class FileStore implements Storage {
  readonly kind = 'filesystem' as const;
  private dir: string;

  constructor(dir?: string) {
    this.dir =
      dir ?? path.join(process.cwd(), '.devlens-cache', 'analysis');
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private fileFor(key: string): string {
    // Sanitize key to a safe filename.
    const safe = key.replace(/[^a-z0-9._-]/gi, '_');
    return path.join(this.dir, `${safe}.json`);
  }

  async get(username: string): Promise<CachedAnalysis | null> {
    try {
      const key = `analysis:${username.toLowerCase()}`;
      const raw = await fs.readFile(this.fileFor(key), 'utf8');
      return JSON.parse(raw) as CachedAnalysis;
    } catch {
      return null;
    }
  }

  async set(entry: CachedAnalysis): Promise<void> {
    await this.ensureDir();
    const key = `analysis:${entry.username.toLowerCase()}`;
    await fs.writeFile(this.fileFor(key), JSON.stringify(entry), 'utf8');
  }

  async has(username: string): Promise<boolean> {
    const key = `analysis:${username.toLowerCase()}`;
    try {
      await fs.access(this.fileFor(key));
      return true;
    } catch {
      return false;
    }
  }

  async remove(username: string): Promise<void> {
    const key = `analysis:${username.toLowerCase()}`;
    try {
      await fs.unlink(this.fileFor(key));
    } catch {
      // ignore missing
    }
  }
}

export * from './types';