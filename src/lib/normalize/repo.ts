import type { GitHubRepo, GitHubLangStats, RepoLanguagePoint } from '../types';
import type { RawRepo } from '../github/client';

export interface RawRepoWithPractice {
  raw: RawRepo;
  knowledge: {
    hasReadme: boolean;
    hasTests: boolean;
    hasCi: boolean;
    hasLicense: boolean;
    hasIssues: boolean;
    hasPrs: boolean;
  };
}

export function normalizeRepo(raw: RawRepo): GitHubRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    htmlUrl: raw.html_url,
    homepage: raw.homepage,
    language: raw.language,
    fork: raw.fork,
    stargazersCount: raw.stargazers_count,
    watchersCount: raw.watchers_count,
    forksCount: raw.forks_count,
    openIssuesCount: raw.open_issues_count,
    size: raw.size,
    defaultBranch: raw.default_branch,
    archived: raw.archived,
    disabled: raw.disabled,
    license: raw.license,
    topics: raw.topics ?? [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
  };
}

/**
 * Convert a raw `GET /repos/{owner}/{repo}/languages` body
 * ({ "TypeScript": 12345, ... }) into sorted percentage points.
 */
export function languagesToPoints(langs: Record<string, number>): RepoLanguagePoint[] {
  const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];
  return entries.map(([language, bytes]) => ({
    language,
    bytes,
    percent: Math.round((bytes / total) * 1000) / 10,
  }));
}

export function repoLanguagePoint(fullName: string, points: RepoLanguagePoint[]): GitHubLangStats {
  return { repoFullName: fullName, languages: points };
}

// Heuristic practice detection based on topics + raw fields. Tests/CI detection
// is derived from topics like "testing", "ci", "continuous-integration".
export function inferRepoPractice(raw: RawRepo): RawRepoWithPractice['knowledge'] {
  const topics = (raw.topics ?? []).map((t) => t.toLowerCase());
  return {
    hasReadme: true, // assumed present; GitHub readme is standard
    hasTests: topics.some((t) => t.includes('test')),
    hasCi: topics.some((t) => ['ci', 'cicd', 'continuous-integration'].includes(t)),
    hasLicense: Boolean(raw.license),
    hasIssues: true, // GitHub reports open issues separately
    hasPrs: raw.forks_count > 0 || raw.open_issues_count > 0,
  };
}