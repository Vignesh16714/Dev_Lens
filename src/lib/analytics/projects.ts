import type { GitHubRepo, ProjectAnalysis, ProjectItem, RepoHealth, RepoLanguagePoint } from '../types';
import type { Dataset } from '../normalize';
import { clamp, avg, round0 } from './util';

const DAY = 86_400_000;

function langsFor(
  repo: GitHubRepo,
  dataset: Dataset
): RepoLanguagePoint[] {
  const found = dataset.repoLanguages.find((l) => l.repoFullName === repo.fullName);
  if (found && found.languages.length) return found.languages;
  if (repo.language)
    return [{ language: repo.language, bytes: repo.size, percent: 100 }];
  return [];
}

function ageDays(createdAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / DAY));
}

function daysSincePush(repo: GitHubRepo, now: number): number {
  if (!repo.pushedAt) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, (now - new Date(repo.pushedAt).getTime()) / DAY);
}

function maintenanceOf(repo: GitHubRepo, daysSincePush: number): ProjectItem['maintenance'] {
  if (repo.archived) return 'archived';
  if (daysSincePush >= 365) return 'stale';
  if (daysSincePush <= 90) return 'active';
  return 'steady';
}

function computeHealth(
  repo: GitHubRepo,
  starsPerDay: number,
  now: number,
  maxStarsPerDay: number
): RepoHealth {
  const pushD = daysSincePush(repo, now);
  const recency = clamp(100 - Math.floor(pushD / 2.5), 5, 100);
  const attention = clamp(Math.round((starsPerDay / Math.max(maxStarsPerDay, 0.001)) * 100), 0, 100);
  const issueHygiene = clamp(100 - Math.min(60, repo.openIssuesCount * (repo.size > 500 ? 2 : 5)), 20, 100);
  const licensing = repo.license ? 100 : 55;
  const documentation = (repo.topics?.includes('documentation') ? 100 : 70) + (repo.description ? 15 : 0);

  const factors = [
    { label: 'Commit recency', value: recency, weight: 0.35, note: pushNote(pushD) },
    { label: 'Community attention', value: attention, weight: 0.3, note: `${fmtRate(starsPerDay)} stars/day` },
    { label: 'Issue hygiene', value: issueHygiene, weight: 0.15, note: `${repo.openIssuesCount} open issues` },
    { label: 'Licensing', value: licensing, weight: 0.1, note: repo.license ? repo.license.name : 'No license detected' },
    { label: 'Documentation', value: clamp(documentation, 0, 100), weight: 0.1, note: repo.description ? 'Has description' : 'Sparse docs' },
  ];

  const score = round0(factors.reduce((s, f) => s + f.value * f.weight, 0));
  return { score: clamp(score, 0, 100), factors };
}

function pushNote(d: number): string {
  if (d >= 365) return 'No push in over a year';
  if (d >= 90) return `Last push ${Math.floor(d)}d ago`;
  if (d >= 30) return `Inactive ${Math.floor(d / 30)}mo`;
  return `Active ${Math.floor(d)}d ago`;
}

function fmtRate(v: number): string {
  if (v >= 1) return v.toFixed(1);
  if (v >= 0.1) return v.toFixed(2);
  return v.toFixed(3);
}

export function computeProjects(dataset: Dataset): ProjectAnalysis {
  const now = Date.now();
  const repos = dataset.repos.filter((r) => !r.fork || r.stargazersCount > 0);
  const maxStarsPerDay = Math.max(1, ...repos.map((r) => r.stargazersCount / Math.max(ageDays(r.createdAt, now), 1)));

  const items: ProjectItem[] = repos
    .map((repo) => {
      const aD = ageDays(repo.createdAt, now);
      const starsPerDay = aD ? repo.stargazersCount / aD : 0;
      const pushD = daysSincePush(repo, now);
      const maintenance = maintenanceOf(repo, pushD);
      const recentPush = maintenance === 'active';
      const health = computeHealth(repo, starsPerDay, now, maxStarsPerDay);
      const activityLevel: ProjectItem['activityLevel'] =
        health.factors[0].value > 80 && starsPerDay > 0.05 ? 'high' : health.factors[0].value > 40 ? 'medium' : 'low';
      return {
        repo,
        languages: langsFor(repo, dataset),
        ageDays: aD,
        starsPerDay,
        recentPush,
        maintenance,
        health,
        activityLevel,
      };
    })
    .sort((a, b) => b.health.score - a.health.score);

  const mix = new Map<string, number>();
  for (const it of items)
    for (const l of it.languages) mix.set(l.language, (mix.get(l.language) ?? 0) + l.bytes);
  const mixTotal = Array.from(mix.values()).reduce((s, v) => s + v, 0);
  const languageMix = Array.from(mix.entries())
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: mixTotal ? Math.round((bytes / mixTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const avgHealth = round0(avg(items.map((i) => i.health.score)));
  const maintenanceScore = (m: ProjectItem['maintenance']): number =>
    m === 'active' ? 100 : m === 'steady' ? 65 : m === 'stale' ? 30 : 5;
  const avgMaintenance = round0(avg(items.map((i) => maintenanceScore(i.maintenance))));

  return {
    items,
    totalStars: dataset.repos.reduce((s, r) => s + r.stargazersCount, 0),
    totalForks: dataset.repos.reduce((s, r) => s + r.forksCount, 0),
    languageMix,
    avgHealth,
    avgMaintenance,
    archivedCount: items.filter((i) => i.repo.archived).length,
    forkedCount: dataset.repos.filter((r) => r.fork).length,
    staleCount: items.filter((i) => i.maintenance === 'stale' || i.maintenance === 'archived').length,
  };
}