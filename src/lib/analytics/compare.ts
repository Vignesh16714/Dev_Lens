import type {
  CompareDimension,
  CompareProfile,
  CompareResult,
  IntelligenceReport,
} from '../types';
import { round0, round1 } from './util';

export function toCompareProfile(
  login: string,
  report: IntelligenceReport
): CompareProfile {
  const collab = report.subScores.collaboration / 100;
  return {
    login,
    intelligenceScore: report.intelligenceScore,
    totalStars: report.metrics.totalStars,
    totalRepos: report.metrics.totalRepos,
    totalCommits: report.metrics.totalCommits,
    activeDaysRatio: round1(report.activity.devlensCalculated.averageActiveRatio),
    totalLanguages: report.metrics.totalLanguages,
    collaborationIndex: collab,
    contributionRecent: report.metrics.recentActivityCount,
  };
}

const DISCLAIMER =
  'Comparison is based only on measurable public GitHub signals available to DevLens. It reflects observable activity, not overall developer quality, skill mastery, or productivity. Metrics depend on public visibility, repo hygiene, and the GitHub event window (~90 days for live data). Treat results as a signal, not a verdict.';

export function computeCompare(a: CompareProfile, b: CompareProfile): CompareResult {
  const dim = (key: string, label: string, vA: number, vB: number, note: string): CompareDimension => ({
    key,
    label,
    a: round0(vA),
    b: round0(vB),
    note,
  });

  const dimensions: CompareDimension[] = [
    dim('score', 'Intelligence score', a.intelligenceScore, b.intelligenceScore, 'Weighted 0–100 from activity, consistency, diversity, collaboration & growth.'),
    dim('stars', 'Total stars', a.totalStars, b.totalStars, 'Sum of stargazers across public repositories.'),
    dim('repos', 'Repositories', a.totalRepos, b.totalRepos, 'Public repositories including forks.'),
    dim('commits', 'Observed commits', a.totalCommits, b.totalCommits, 'Commit-derived activity in the observation window.'),
    dim('active', 'Active-day ratio (%)', a.activeDaysRatio * 100, b.activeDaysRatio * 100, 'Share of observed days with contribution activity.'),
    dim('languages', 'Languages', a.totalLanguages, b.totalLanguages, 'Distinct languages detected across repositories.'),
    dim('collab', 'Collaboration index', a.collaborationIndex * 100, b.collaborationIndex * 100, 'Share of collaboration events (PRs, reviews, issues) among activity.'),
    dim('recent', 'Activity (last 30d)', a.contributionRecent, b.contributionRecent, 'Contribution events in the trailing 30 days.'),
  ];

  return { a, b, dimensions, disclaimer: DISCLAIMER };
}