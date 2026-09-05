import type { SubScores } from '../types';
import { clamp, round0 } from './util';

/** Inputs required to compute scores. All derived from measurables. */
export interface ScoreInput {
  totalCommits: number;
  githubReportedEvents: number;
  activeDays: number;
  uniqueDays: number;
  averageActiveRatio: number;
  recentActivityCount: number;
  totalLanguages: number;
  ownedRepos: number;
  totalRepos: number;
  prEvents: number;
  reviewEvents: number;
  issueOpenEvents: number;
  commentEvents: number;
  totalCollabEvents: number;
  momentum: number; // -100..100 from growth analysis
  weeklyBuckets: { active: number; total: number };
  risingLanguages: number;
}

export interface ScoreWithDetail {
  score: number;
  label: string;
  basis: string[]; // human-readable factual basis
}

export interface ScoreOutcome {
  subScores: SubScores;
  intelligenceScore: number;
  details: Record<keyof SubScores, ScoreWithDetail>;
}

const W = { activity: 0.25, consistency: 0.25, diversity: 0.15, collaboration: 0.2, growth: 0.15 };

export function computeScores(input: ScoreInput): ScoreOutcome {
  const commitsFactor = clamp(input.totalCommits / 400, 0, 1);
  const activeRatio = clamp(input.averageActiveRatio, 0, 1);
  const recentFactor = clamp(input.recentActivityCount / 120, 0, 1);
  const eventFactor = clamp(input.githubReportedEvents / 800, 0, 1);

  const activityScore = round0(
    100 * (0.3 * commitsFactor + 0.35 * activeRatio + 0.2 * recentFactor + 0.15 * eventFactor)
  );

  const regularity = input.weeklyBuckets.total
    ? input.weeklyBuckets.active / input.weeklyBuckets.total
    : 0;
  const consistencyScore = round0(100 * (0.75 * activeRatio + 0.25 * regularity));

  const langFactor = clamp(input.totalLanguages / 8, 0, 1);
  const repoVariety = clamp(input.ownedRepos / 12, 0, 1);
  const diversityScore = round0(100 * (0.7 * langFactor + 0.3 * repoVariety));

  const collabRatio = clamp(input.totalCollabEvents / Math.max(input.githubReportedEvents || 1, 1), 0, 1);
  const prFactor = clamp(input.prEvents / 40, 0, 1);
  const reviewFactor = clamp(input.reviewEvents / 30, 0, 1);
  const collaborationScore = round0(
    100 * (0.35 * collabRatio + 0.35 * prFactor + 0.3 * reviewFactor)
  );

  const momentumNorm = clamp((input.momentum + 100) / 200, 0, 1);
  const growthActivity = clamp(input.recentActivityCount / Math.max(input.githubReportedEvents, 1), 0, 1);
  const risingFactor = clamp(input.risingLanguages / 3, 0, 1);
  const growthScore = round0(100 * (0.5 * momentumNorm + 0.3 * growthActivity + 0.2 * risingFactor));

  const intelligenceScore = round0(
    activityScore * W.activity +
      consistencyScore * W.consistency +
      diversityScore * W.diversity +
      collaborationScore * W.collaboration +
      growthScore * W.growth
  );

  const subScores: SubScores = {
    activity: activityScore,
    consistency: consistencyScore,
    diversity: diversityScore,
    collaboration: collaborationScore,
    growth: growthScore,
  };

  const details: ScoreOutcome['details'] = {
    activity: {
      score: activityScore,
      label: 'Activity',
      basis: [
        `${input.totalCommits} commits (${(commitsFactor * 100).toFixed(0)}% of benchmark)`,
        `${input.activeDays}/${input.uniqueDays} active days`,
        `${input.recentActivityCount} events in the last 30 days`,
      ],
    },
    consistency: {
      score: consistencyScore,
      label: 'Consistency',
      basis: [
        `${(activeRatio * 100).toFixed(1)}% of days show activity`,
        `${(regularity * 100).toFixed(0)}% of recent weeks active`,
      ],
    },
    diversity: {
      score: diversityScore,
      label: 'Project Diversity',
      basis: [
        `${input.totalLanguages} languages detected`,
        `${input.ownedRepos} original repositories (${input.totalRepos} total)`,
      ],
    },
    collaboration: {
      score: collaborationScore,
      label: 'Collaboration',
      basis: [
        `${input.prEvents} pull requests`,
        `${input.reviewEvents} reviews`,
        `${input.totalCollabEvents} collaboration events`,
      ],
    },
    growth: {
      score: growthScore,
      label: 'Growth',
      basis: [
        `Momentum ${input.momentum >= 0 ? '+' : ''}${input.momentum} (vs prior periods)`,
        `${input.risingLanguages} rising technologies`,
      ],
    },
  };

  return { subScores, intelligenceScore, details };
}