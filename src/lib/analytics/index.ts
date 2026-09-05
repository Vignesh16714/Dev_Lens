import type { IntelligenceReport, RepoLanguagePoint } from '../types';
import type { Dataset } from '../normalize';
import { computeActivity, type ActivityComputed } from './activity';
import { computeProjects } from './projects';
import { computeGrowth } from './growth';
import { computeScores, type ScoreInput } from './score';
import { buildAiProfile, type AiEvidence } from '../ai';
import { computeCareer, type CareerEvidence } from './career';
import { daysBetween } from './util';

/** Distinct active weeks across the trailing 52-week window. */
function weeklyBuckets(dataset: Dataset): { active: number; total: number } {
  const now = Date.now();
  const cutoff = now - 52 * 7 * 86_400_000;
  const weekSet = new Set<string>();
  for (const e of dataset.events) {
    const ts = new Date(e.iso).getTime();
    if (ts < cutoff) continue;
    const start = ts - new Date(ts).getUTCDay() * 86_400_000;
    weekSet.add(new Date(start).toISOString().slice(0, 10));
  }
  return { active: weekSet.size, total: 52 };
}

function commentEvents(dataset: Dataset): number {
  const keys = new Set(['Issue comments', 'Review comments', 'Commit comments']);
  return dataset.eventBreakdown
    .filter((b) => keys.has(b.type))
    .reduce((s, b) => s + b.count, 0);
}

/** Aggregate language mix as percentage points. */
function languageMix(dataset: Dataset): RepoLanguagePoint[] {
  const map = new Map<string, number>();
  for (const l of dataset.languageMix) map.set(l.language, l.bytes);
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  if (!total) return [];
  return Array.from(map.entries())
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

/** Assemble the complete intelligence report from a normalized dataset. */
export function buildIntelligenceReport(dataset: Dataset): IntelligenceReport {
  const activityRun: ActivityComputed = computeActivity(dataset);
  const projects = computeProjects(dataset);
  const growth = computeGrowth(
    dataset,
    activityRun.activity.monthlySeries.map((m) => ({ month: m.month, count: m.events }))
  );

  const mix = languageMix(dataset);
  const primaryLanguages = mix
    .filter((l) => l.percent >= 3 || mix.indexOf(l) < 3)
    .map((l) => l.language);

  const accountAgeDays = daysBetween(dataset.user.createdAt, Date.now());
  const totalRepos = dataset.repos.length;
  const forkedRepos = dataset.repos.filter((r) => r.fork).length;
  const ownedRepos = Math.max(0, totalRepos - forkedRepos);
  const topRepo = dataset.repos.reduce(
    (best, r) => (best === null || r.stargazersCount > best.stargazersCount ? r : best),
    null as (typeof dataset.repos)[number] | null
  );

  const { active, total } = weeklyBuckets(dataset);
  const prs = activityRun.activity.githubReported.prs;
  const reviews = activityRun.activity.githubReported.reviews;
  const issues = activityRun.activity.githubReported.issues;
  const comments = commentEvents(dataset);
  const totalCollabEvents = prs + reviews + issues + comments;

  const scoreInput: ScoreInput = {
    totalCommits: activityRun.metrics.totalCommits,
    githubReportedEvents: activityRun.metrics.githubReportedEvents,
    activeDays: activityRun.metrics.activeDays,
    uniqueDays: activityRun.metrics.uniqueDays,
    averageActiveRatio: activityRun.metrics.averageActiveRatio,
    recentActivityCount: activityRun.metrics.recentActivityCount,
    totalLanguages: mix.length,
    ownedRepos,
    totalRepos,
    prEvents: prs,
    reviewEvents: reviews,
    issueOpenEvents: issues,
    commentEvents: comments,
    totalCollabEvents,
    momentum: growth.trajectory.momentum,
    weeklyBuckets: { active, total },
    risingLanguages: growth.languageCategories.filter((c) => c.trend === 'rising').length,
  };
  const scoring = computeScores(scoreInput);

  const aiEvidence: AiEvidence = {
    intelligenceScore: scoring.intelligenceScore,
    subScores: scoring.subScores,
    primaryLanguages,
    totalCommits: activityRun.metrics.totalCommits,
    totalRepos,
    totalStars: projects.totalStars,
    activeRatio: activityRun.metrics.averageActiveRatio,
    recentActivity: activityRun.metrics.recentActivityCount,
    prs,
    reviews,
    issues,
    momentum: growth.trajectory.momentum,
    trendDirection: activityRun.activity.trendDirection,
    projects,
    growth,
    accountAgeDays,
  };
  const ai = buildAiProfile(aiEvidence);
const report: IntelligenceReport = {
    user: dataset.user,
    metrics: {
      totalCommits: activityRun.metrics.totalCommits,
      totalRepos,
      forkedRepos,
      ownedRepos,
      totalStars: projects.totalStars,
      totalForks: projects.totalForks,
      totalIssuesOpened: issues,
      totalPrs: prs,
      totalReviews: reviews,
      totalLanguages: mix.length,
      primaryLanguages,
      accountAgeDays,
      activeDays: activityRun.metrics.activeDays,
      uniqueDays: activityRun.metrics.uniqueDays,
      contributionDaysCount: activityRun.metrics.activeDays,
      averageActiveRatio: activityRun.activity.devlensCalculated.averageActiveRatio,
      languagesByShare: mix,
      topRepoByStars: topRepo
        ? { name: topRepo.name, stars: topRepo.stargazersCount }
        : null,
      recentActivityCount: activityRun.metrics.recentActivityCount,
    },
    subScores: scoring.subScores,
    intelligenceScore: scoring.intelligenceScore,
    activity: activityRun.activity,
    projects,
    growth,
    ai,
  };

  return report;
}

/** Build the career-readiness analysis from a finished report. */
export function buildCareer(report: IntelligenceReport) {
  const evidence: CareerEvidence = {
    languages: report.metrics.primaryLanguages,
    subScores: report.subScores,
    totalCommits: report.metrics.totalCommits,
    totalRepos: report.metrics.totalRepos,
    collaborationIndex: report.subScores.collaboration / 100,
    momentum: report.growth.trajectory.momentum,
  };
  return computeCareer(evidence);
}