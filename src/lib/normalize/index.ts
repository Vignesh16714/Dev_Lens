import type {
  GitHubUser,
  GitHubRepo,
  GitHubLangStats,
  RepoLanguagePoint,
  ContributionDay,
  EventActivity,
} from '../types';
import type { NormalizedEvent } from './events';

/**
 * The single normalized dataset the analytics engine consumes. Produced either
 * from live GitHub data (through the normalizers) or directly by the mock
 * provider. Keeping analytics coupled to this shape — not to any specific
 * GitHub response — is what makes switching/caching trivial.
 */
export interface Dataset {
  user: GitHubUser;
  repos: GitHubRepo[];
  /** Languages observed per analyzed repository (subset of repos). */
  repoLanguages: GitHubLangStats[];
  /** Full language mix aggregated across analyzed repos. */
  languageMix: RepoLanguagePoint[];
  events: NormalizedEvent[];
  heatmap: ContributionDay[];
  eventBreakdown: EventActivity[];
  /** Push-derived commit count from observed events. */
  commitEventsCount: number;
  githubReported: {
    prCount: number;
    issueCount: number;
    reviewCount: number;
    contributedRepos: number;
    events: number;
  };
  // Metadata about how the dataset was produced, for provenance/UI copy.
  meta: {
    source: 'github' | 'mock';
    observationDays: number; // how far back activity observations reach
    languagesAnalyzed: number;
  };
}

export * from './user';
export * from './repo';
export * from './events';

import { normalizeUser } from './user';
import { normalizeRepo } from './repo';
import { normalizeEvents, sumPushCommits } from './events';

export { normalizeUser, normalizeRepo };

export function combineDataset(data: {
  userRaw: import('../github/client').RawUser;
  reposRaw: import('../github/client').RawRepo[];
  languages: Record<string, Record<string, number>>; // fullName -> lang -> bytes
  events: import('../github/client').RawEvent[];
}): Dataset {
  const user = normalizeUser(data.userRaw);
  const repos = data.reposRaw.map(normalizeRepo);

  const repoLanguages: GitHubLangStats[] = [];
  const mix = new Map<string, number>();
  for (const [fullName, langBytes] of Object.entries(data.languages)) {
    const entries = Object.entries(langBytes);
    const total = entries.reduce((s, [, b]) => s + b, 0);
    const points = entries
      .map(([language, bytes]) => ({
        language,
        bytes,
        percent: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);
    repoLanguages.push({ repoFullName: fullName, languages: points });
    for (const p of points) {
      mix.set(p.language, (mix.get(p.language) ?? 0) + p.bytes);
    }
  }

  const mixTotal = Array.from(mix.values()).reduce((s, v) => s + v, 0);
  const languageMix = Array.from(mix.entries())
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: mixTotal > 0 ? Math.round((bytes / mixTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const { events, heatmap, breakdown } = normalizeEvents(data.events);

  const prCount = data.events.filter((e) => e.type === 'PullRequestEvent').length;
  const issueCount = data.events.filter((e) => e.type === 'IssuesEvent').length;
  const reviewCount = data.events.filter(
    (e) => e.type === 'PullRequestReviewEvent' || e.type === 'PullRequestReviewCommentEvent'
  ).length;
  const contributedRepos = new Set(data.events.map((e) => e.repo?.name)).size;

  return {
    user,
    repos,
    repoLanguages,
    languageMix,
    events,
    heatmap,
    eventBreakdown: breakdown,
    commitEventsCount: sumPushCommits(data.events),
    githubReported: {
      prCount,
      issueCount,
      reviewCount,
      contributedRepos,
      events: data.events.length,
    },
    meta: {
      source: 'github',
      observationDays: 90,
      languagesAnalyzed: repoLanguages.length,
    },
  };
}