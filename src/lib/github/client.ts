// Server-side GitHub REST API client. Never imported by browser components.
// Handles authentication via a server-only token, pagination, rate limits and
// network failures. Callers decide whether to fall back to demo data.

const GH_API = 'https://api.github.com';

export interface RawUser {
  login: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string | null;
  type: 'User' | 'Organization';
  hireable: boolean | null;
  html_url: string;
}

export interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  archived: boolean;
  disabled: boolean;
  license: { key: string; name: string } | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  owner: { login: string };
}

export interface RawEvent {
  type: string;
  created_at: string;
  public: boolean;
  repo: { name: string };
  actor: { login: string };
  payload?: {
    size?: number;
    ref_type?: string;
    action?: string;
    commits?: Array<{ message: string }>;
  };
}

export type ApiFailure = 'not-found' | 'rate-limited' | 'network' | 'auth';

export class GithubApiError extends Error {
  kind: ApiFailure;
  status?: number;
  constructor(kind: ApiFailure, message: string, status?: number) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

function hasToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function headers(etag: string | null = null): HeadersInit {
  const h: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'DevLens',
  };
  if (hasToken()) {
    h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN as string}`;
  }
  if (etag) h['If-None-Match'] = etag;
  return h;
}

/** Extract a canonical username from either "@user", a bare username, or a
 *  GitHub profile URL. Returns null when the input does not parse. */
export function extractUsername(input: string): string | null {
  const trimmed = input.trim().replace(/^@/, '');
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.hostname.toLowerCase() === 'github.com') {
      const seg = url.pathname.split('/').filter(Boolean);
      return seg[0] ? seg[0] : null;
    }
    return null;
  } catch {
    // Not a URL — treat as a bare username.
  }
  if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Fetch with timeout and abort handling.
 * GitHub API can be slow or unresponsive — we must not hang indefinitely.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new GithubApiError('network', `Request timed out after ${timeoutMs / 1000}s`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function rawGet<T>(path: string, etag?: string): Promise<{ data: T; etag: string | null }> {
  let res: Response;
  try {
    // 15 second timeout per GitHub API request — generous but bounded
    res = await fetchWithTimeout(
      `${GH_API}${path}`,
      { headers: headers(etag), next: { revalidate: 0 } },
      15_000
    );
  } catch (e) {
    if (e instanceof GithubApiError) throw e;
    throw new GithubApiError('network', 'Network error reaching GitHub API.');
  }

  if (res.status === 404) throw new GithubApiError('not-found', 'GitHub resource not found', 404);
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    throw new GithubApiError(
      'rate-limited',
      remaining === '0' ? 'GitHub API rate limit exceeded' : 'GitHub API access forbidden',
      403
    );
  }
  if (res.status === 401) throw new GithubApiError('auth', 'GitHub token rejected', 401);
  if (!res.ok) throw new GithubApiError('network', `GitHub API error ${res.status}`, res.status);

  const data = (await res.json()) as T;
  return { data, etag: res.headers.get('etag') };
}

/** A tiny concurrency limiter so bulk language fetches never fire all at once. */
class Limiter {
  private queue: Array<() => void> = [];
  private active = 0;
  constructor(private max: number) {}
  private next() {
    if (this.queue.length && this.active < this.max) {
      this.active++;
      const fn = this.queue.shift()!;
      fn();
    }
  }
  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const worker = async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          this.active--;
          this.next();
        }
      };
      this.queue.push(() => void worker());
      this.next();
    });
  }
}

export interface GithubClient {
  getUser(username: string): Promise<{ user: RawUser; etag: string | null }>;
  getRepos(username: string, max?: number): Promise<RawRepo[]>;
  getLanguages(fullName: string): Promise<Record<string, number>>;
  getEvents(username: string, maxEvents: number): Promise<RawEvent[]>;
}

const CONCURRENCY = 4;
const REPO_PAGE_SIZE = 100;

export function createGithubClient(): GithubClient {
  const limiter = new Limiter(CONCURRENCY);

  // Repository caching for the duration of a single analysis run.
  const repoCache = new Map<string, RawRepo[]>();

  async function getUser(username: string) {
    const { data, etag } = await rawGet<RawUser>(`/users/${username}`);
    return { user: data, etag };
  }

  async function fetchRepoPage(username: string, page: number): Promise<RawRepo[]> {
    const { data } = await rawGet<RawRepo[]>(
      `/users/${username}/repos?per_page=${REPO_PAGE_SIZE}&page=${page}&sort=pushed`
    );
    return data;
  }

  async function getRepos(username: string, max = 100): Promise<RawRepo[]> {
    const cached = repoCache.get(username);
    if (cached) return cached;
    const all: RawRepo[] = [];
    let page = 1;
    for (;;) {
      const batch = await fetchRepoPage(username, page);
      all.push(...batch);
      if (batch.length < REPO_PAGE_SIZE || all.length >= max) break;
      page++;
    }
    const trimmed = all.slice(0, max);
    repoCache.set(username, trimmed);
    return trimmed;
  }

  async function getLanguages(fullName: string): Promise<Record<string, number>> {
    return limiter.run(async () => {
      try {
        const { data } = await rawGet<Record<string, number>>(`/repos/${fullName}/languages`);
        return data;
      } catch (e) {
        if (e instanceof GithubApiError && e.kind === 'not-found') return {};
        throw e;
      }
    });
  }

  async function getEvents(username: string, maxEvents: number): Promise<RawEvent[]> {
    const all: RawEvent[] = [];
    for (let page = 1; ; page++) {
      const { data } = await rawGet<RawEvent[]>(
        `/users/${username}/events?per_page=100&page=${page}`
      );
      all.push(...data);
      if (all.length >= maxEvents || data.length < 100) break;
    }
    return all.slice(0, maxEvents);
  }

  return {
    getUser,
    getRepos,
    getLanguages,
    getEvents,
  };
}
