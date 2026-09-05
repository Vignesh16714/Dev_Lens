import type { GitHubUser } from '../types';

const OBSERVE_DAYS = 855;

function buildUser(
  username: string,
  style: string,
  rnd: () => number,
  accountCreated: number
): GitHubUser {
  const base = pick(rnd, FIRST);
  const skill = style === 'ml' ? 'ML' : style;
  return {
    login: username,
    name: `${base} ${(username[0] ?? 'D').toUpperCase()}.`,
    avatarUrl: null,
    bio:
      rnd() > 0.5
        ? `${capitalize(skill)} developer focused on clean, maintainable software.`
        : 'Building tools that ship. Open source contributor and lifelong learner.',
    company: rnd() > 0.5 ? pick(rnd, ['Acme Labs', 'Northwind Co', 'Startup Inc', 'OpenHarbor']) : null,
    location: pick(rnd, ['San Francisco', 'London', 'Berlin', 'Bengaluru', 'Toronto', 'Remote']),
    blog: null,
    twitterUsername: rnd() > 0.6 ? username : null,
    followers: Math.floor(rnd() * 600),
    following: Math.floor(rnd() * 320),
    publicRepos: 0,
    publicGists: Math.floor(rnd() * 12),
    createdAt: dateISO(accountCreated),
    updatedAt: dateISO(NOW - Math.floor(rnd() * 20) * DAY),
    type: 'User',
    hireable: rnd() > 0.7,
  };
}

function buildEvents(
  rnd: () => number,
  username: string,
  style: string,
  stack: string[]
): RawEvent[] {
  const events: RawEvent[] = [];
  const observeStart = NOW - OBSERVE_DAYS * DAY;
  const baseDensity = 0.3 + rnd() * 0.55;

  for (let d = 0; d < OBSERVE_DAYS; d++) {
    const dayStart = observeStart + d * DAY;
    const dow = new Date(dayStart).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    let p = baseDensity * (weekend ? 0.55 : 0.9);
    const month = new Date(dayStart).getUTCMonth();
    if (month === 0 || month === 6) p *= 0.82; // winter / summer troughs
    if (rnd() < 0.05) p *= 0.15; // off-weeks
    if (rnd() < 0.03) p *= 3; // bursts
    if (rnd() >= p) continue;

    const dayEvents = 1 + Math.floor(rnd() * 8);
    const base = new Date(dayStart);
    for (let k = 0; k < dayEvents; k++) {
      const when = new Date(base.getTime() + (k * 4100 + Math.floor(rnd() * 2600)) * 1000);
      events.push(rawEvent(rnd, username, when, style));
    }
  }
  events.sort((a, b) => a.created_at.localeCompare(b.created_at));
  void stack;
  return events;
}

/**
 * Build a complete, normalized, deterministic demo dataset for `username`.
 */
export function buildMockDataset(username: string): Dataset {
  const rnd = mulberry32(hashString(username.toLowerCase()));
  const style = pick(rnd, Object.keys(LANG_STACKS));
  const stack = LANG_STACKS[style];
  const accountAgeMonths = 14 + Math.floor(rnd() * 60);
  const accountCreated = NOW - accountAgeMonths * 30 * DAY;

  const user = buildUser(username, style, rnd, accountCreated);
  const { repos, languages } = buildRepos(username, style, stack, rnd, accountCreated);
  const events = buildEvents(rnd, username, style, stack);

  const dataset = combineDataset({
    userRaw: {
      login: user.login,
      name: user.name,
      avatar_url: null,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: null,
      twitter_username: user.twitterUsername,
      followers: user.followers,
      following: user.following,
      public_repos: repos.length,
      public_gists: user.publicGists,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      type: 'User',
      hireable: user.hireable,
      html_url: `https://github.com/${user.login}`,
    },
    reposRaw: repos,
    languages,
    events,
  });

  dataset.meta.source = 'mock';
  dataset.meta.observationDays = OBSERVE_DAYS;
  return dataset;
}
// Deterministic demo data provider. Generates a realistic developer dataset for
// any username using a seeded PRNG, so the same username always yields the same
// profile. Used when the GitHub API is unavailable (no token + network/rate-limit
// failure) so the product can always be explored end-to-end.

import type { RawEvent, RawRepo } from './client';
import { combineDataset, type Dataset } from '../normalize';

const NOW = Date.now();
const DAY = 86_400_000;

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rnd: () => number, arr: T[]): T =>
  arr[Math.floor(rnd() * arr.length)];

const FIRST = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Avery',
  'Drew', 'Parker', 'Quinn', 'Robin', 'Skyler', 'Ellis', 'Harper', 'Reese',
];

const LANG_STACKS: Record<string, string[]> = {
  frontend: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'SCSS'],
  backend: ['Python', 'Go', 'TypeScript', 'Java', 'SQL'],
  fullstack: ['TypeScript', 'JavaScript', 'Python', 'CSS', 'HTML'],
  ml: ['Python', 'Jupyter Notebook', 'TypeScript', 'C++', 'SQL'],
  devops: ['Go', 'Python', 'Shell', 'TypeScript', 'HCL'],
};

const REPO_ADJ = [
  'hub', 'kit', 'cli', 'board', 'stack', 'forge', 'grid', 'pulse',
  'scope', 'trace', 'forge', 'prism', 'orbit', 'beacon', 'sdk', 'api',
];
const REPO_THEME = [
  'devtools', 'analytics', 'scheduler', 'auth', 'notify', 'docs', 'metrics',
  'config', 'pipeline', 'events', 'cache', 'search', 'sync', 'webhooks',
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dateISO(ts: number): string {
  return new Date(ts).toISOString();
}

function repoName(rnd: () => number, i: number): string {
  const theme = REPO_THEME[i % REPO_THEME.length];
  const adj = pick(rnd, REPO_ADJ);
  // Avoid duplicate adj within a profile run.
  return rnd() > 0.4 ? `${theme}-${adj}` : theme;
}

// --- raw builders ---------------------------------------------------------

function buildRepos(
  username: string,
  style: string,
  stack: string[],
  rnd: () => number,
  accountCreated: number
): { repos: RawRepo[]; languages: Record<string, Record<string, number>>; topics: Record<string, string[]> } {
  const count = 6 + Math.floor(rnd() * 16);
  const repos: RawRepo[] = [];
  const languages: Record<string, Record<string, number>> = {};
  const topics: Record<string, string[]> = {};
  const startIdx = Math.floor(rnd() * 6);

  for (let i = 0; i < count; i++) {
    const name = repoName(rnd, i + startIdx);
    const full = `${username}/${name}`;
    const created = accountCreated + (startIdx + i) * 26 * DAY + Math.floor(rnd() * 12) * DAY;
    const ageDays = Math.max(7, Math.floor((NOW - created) / DAY));
    const primary = stack.length ? stack[0] : 'TypeScript';
    const stars = Math.floor(Math.pow(rnd(), 1.8) * 460);
    const forks = Math.floor(stars * (0.05 + rnd() * 0.18));
    const pushed = created + Math.floor(ageDays * (0.25 + rnd() * 0.72)) * DAY;

    repos.push({
      id: Math.floor(rnd() * 1e8),
      name,
      full_name: full,
      description:
        rnd() > 0.15
          ? `${pick(rnd, ['A lightweight', 'A production-grade', 'An opinionated', 'A developer-friendly'])} ${pick(rnd, ['devtool', 'service', 'library', 'dashboard', 'starter kit'])} built with ${primary}.`
          : null,
      html_url: `https://github.com/${full}`,
      homepage: null,
      language: pick(rnd, stack),
      fork: rnd() < 0.16,
      stargazers_count: stars,
      watchers_count: stars,
      forks_count: forks,
      open_issues_count: Math.floor(rnd() * 16),
      size: Math.floor(300 + rnd() * 8000),
      default_branch: 'main',
      archived: rnd() < 0.06,
      disabled: false,
      license: rnd() > 0.35 ? { key: 'mit', name: 'MIT License' } : null,
      topics: [],
      created_at: dateISO(created),
      updated_at: dateISO(Math.max(created, NOW - Math.floor(rnd() * 40) * DAY)),
      pushed_at: pushed <= NOW ? dateISO(pushed) : dateISO(NOW - Math.floor(rnd() * 8) * DAY),
      owner: { login: username },
    });

    const langBytes: Record<string, number> = {};
    langBytes[primary] = Math.floor(4000 + rnd() * 800000);
    const rest = stack.filter((l) => l !== primary);
    let rem = Math.floor(rnd() * 300000);
    rest.forEach((l, k) => {
      const b = k === rest.length - 1 ? rem : Math.floor(rem * (0.1 + rnd() * 0.4));
      langBytes[l] = b;
      rem -= b;
    });
    languages[full] = langBytes;
    topics[full] = rnd() > 0.5 ? ['ci'].concat(rnd() > 0.5 ? ['documentation'] : []) : [];
  }

  return { repos, languages, topics: topics };
}

function rawEvent(rnd: () => number, username: string, when: Date, style: string): RawEvent {
  // Heavier weight on commits; then PR/review/issue events.
  const roll = rnd();
  let type = 'PushEvent';
  if (roll > 0.78) type = 'PullRequestEvent';
  else if (roll > 0.68) type = 'PullRequestReviewEvent';
  else if (roll > 0.58) type = 'IssuesEvent';
  else if (roll > 0.5) type = 'IssueCommentEvent';
  type = type;
  void style;
  return {
    type,
    created_at: when.toISOString(),
    public: true,
    repo: { name: `${username}/${pick(rnd, ['devtools-hub', 'analytics-kit', 'pipeline-cli', 'docs-forge', 'config-prism'])}` },
    actor: { login: username },
    payload:
      type === 'PushEvent'
        ? { size: 1 + Math.floor(rnd() * 6) }
        : type === 'PullRequestReviewEvent'
          ? { action: 'submitted' }
          : {},
  };
}