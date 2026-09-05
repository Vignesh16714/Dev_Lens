import type { AiProfile, ProjectAnalysis, GrowthAnalysis } from '../types';
import type { SubScores } from '../types';
import { clamp, round0 } from '../analytics/util';

/**
 * The AI layer is *evidence-based*. It only ever asserts facts that can be
 * traced back to a measured metric, and every claim carries its evidence
 * string. No unsupported facts are invented. When an LLM API is configured,
 * the provider can enrich this deterministic base, but always receives the
 * same structured analytics.
 */
export interface AiEvidence {
  intelligenceScore: number;
  subScores: SubScores;
  primaryLanguages: string[];
  totalCommits: number;
  totalRepos: number;
  totalStars: number;
  activeRatio: number;
  recentActivity: number;
  prs: number;
  reviews: number;
  issues: number;
  momentum: number;
  trendDirection: string;
  projects: ProjectAnalysis;
  growth: GrowthAnalysis;
  accountAgeDays: number;
}

export function buildAiProfile(e: AiEvidence): AiProfile {
  const persona = describePersona(e);
  const strengths = buildStrengths(e);
  const weaknesses = buildWeaknesses(e);
  const principles = buildPatterns(e);
  const trajectory = describeTrajectory(e);
  const recommendations = buildRecommendations(e);

  const provenance = [
    { label: 'Intelligence score', value: `${e.intelligenceScore}/100` },
    { label: 'Commits observed', value: `${e.totalCommits}` },
    { label: 'Repositories', value: `${e.totalRepos}` },
    { label: 'Languages', value: `${e.primaryLanguages.length || 1}` },
    { label: 'Activity window', value: `${e.growth.activityTrend.length} months` },
  ];

  return {
    persona,
    summary: summary(e, persona),
    strengths,
    weaknesses,
    patterns: principles,
    trajectory,
    recommendations,
    provenance,
  };
}

// --- Persona ---------------------------------------------------------------

function describePersona(e: AiEvidence): string {
  const stack = e.primaryLanguages.slice(0, 3).join('/');
  const builder =
    e.subScores.activity >= 55 && e.intelligenceScore >= 45
      ? 'Builder'
      : 'Maintainer / explorer';
  const style =
    e.subScores.collaboration >= 55
      ? 'collaborative'
      : e.subScores.consistency >= 55
        ? 'disciplined'
        : 'experimental';
  return `${builder} with a ${style} streak, strongly ${stack || 'TypeScript'} based`;
}

function summary(e: AiEvidence, persona: string): string {
  const active = `${Math.round(e.activeRatio * 100)}%`;
  return `${cap(persona)}. Maintains ${e.totalRepos} repositories (${e.totalStars} total stars, ${e.totalCommits} observed commits). Primary stack: ${e.primaryLanguages.slice(0, 3).join(', ') || '—'}. Recent momentum is ${e.momentum >= 0 ? 'positive' : 'cooling'} with ${e.recentActivity} activity events in the last 30 days.`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// --- Strengths -------------------------------------------------------------

function buildStrengths(e: AiEvidence): AiProfile['strengths'] {
  const s: AiProfile['strengths'] = [];

  if (e.subScores.consistency >= 55) {
    s.push({
      title: 'Highly consistent contributor',
      detail: `Active on ${Math.round(e.activeRatio * 100)}% of observed days, a strong habitual cadence.`,
      evidence: `${Math.round(e.activeRatio * 100)}% active-day ratio`,
    });
  }
  if (e.subScores.activity >= 55) {
    s.push({
      title: 'Substantial output volume',
      detail: `${e.totalCommits} commits and ${e.recentActivity} events in the last 30 days.`,
      evidence: `${e.totalCommits} observed commits`,
    });
  }
  if (e.subScores.collaboration >= 55) {
    s.push({
      title: 'Actively collaborates',
      detail: `${e.prs} pull requests and ${e.reviews} reviews indicate real team interplay.`,
      evidence: `${e.prs} PRs, ${e.reviews} reviews`,
    });
  }
  if (e.subScores.diversity >= 55) {
    s.push({
      title: 'Broad technology range',
      detail: `Comfortable across ${e.primaryLanguages.length || 1} languages.`,
      evidence: `${e.primaryLanguages.length || 1} languages detected`,
    });
  }
  if (e.projects.avgHealth >= 55) {
    s.push({
      title: 'Well-maintained projects',
      detail: `Average project health of ${e.projects.avgHealth}/100 across ${e.projects.items.length} repositories.`,
      evidence: `Avg project health ${e.projects.avgHealth}/100`,
    });
  }
  if (e.momentum >= 15) {
    s.push({
      title: 'Momentum on the rise',
      detail: `Growth trajectory is accelerating with momentum +${e.momentum}.`,
      evidence: `Momentum +${e.momentum}`,
    });
  }
  if (!s.length) {
    s.push({
      title: 'Active open-source presence',
      detail: 'Consistent GitHub footprint with a growing repository set.',
      evidence: `${e.totalRepos} repositories, ${e.recentActivity} recent events`,
    });
  }
  return s;
}

// --- Weaknesses ------------------------------------------------------------

function buildWeaknesses(e: AiEvidence): AiProfile['weaknesses'] {
  const w: AiProfile['weaknesses'] = [];

  if (e.subScores.consistency < 50) {
    w.push({
      title: 'Irregular contribution cadence',
      detail: `Only ${Math.round(e.activeRatio * 100)}% of observed days show activity, suggesting bursty work patterns.`,
      evidence: `${Math.round(e.activeRatio * 100)}% active-day ratio`,
    });
  }
  if (e.subScores.collaboration < 50) {
    w.push({
      title: 'Limited visible collaboration',
      detail: `Few pull requests (${e.prs}) and reviews (${e.reviews}) make team contribution harder to gauge.`,
      evidence: `${e.prs} PRs, ${e.reviews} reviews`,
    });
  }
  if (e.projects.staleCount > Math.max(e.projects.items.length / 3, 1)) {
    w.push({
      title: 'Many dormant repositories',
      detail: `${e.projects.staleCount} of ${e.projects.items.length} repositories are stale or archived.`,
      evidence: `${e.projects.staleCount} stale/archived repos`,
    });
  }
  if (e.projects.avgHealth < 50 && e.projects.items.length > 0) {
    w.push({
      title: 'Project health below average',
      detail: `Average project health ${e.projects.avgHealth}/100 suggests documentation, licensing or maintenance needs attention.`,
      evidence: `Avg project health ${e.projects.avgHealth}/100`,
    });
  }
  if (e.momentum <= -10) {
    w.push({
      title: 'Cooling momentum',
      detail: `Recent activity has dipped (momentum ${e.momentum}).`,
      evidence: `Momentum ${e.momentum}`,
    });
  }
  if (!w.length) {
    w.push({
      title: 'Limited differentiation evident',
      detail: 'No dominant weakness detected from public signals; more repository depth would sharpen the picture.',
      evidence: 'Distributed signal across metrics',
    });
  }
  return w;
}
// --- Development patterns --------------------------------------------------

function buildPatterns(e: AiEvidence): string[] {
  const p: string[] = [];

  if (e.activeRatio > 0.5) {
    p.push(`Works steadily — active on ${Math.round(e.activeRatio * 100)}% of days rather than in isolated bursts.`);
  } else {
    p.push(`Shows burst-style output — activity concentrates into a subset of active days (${Math.round(e.activeRatio * 100)}%).`);
  }
  if (e.reviews > 5) {
    p.push(`Engages in code review (${e.reviews} reviews), a hallmark of collaborative, team-aware development.`);
  }
  if (e.issues > 5) {
    p.push(`Opens and engages with issues (${e.issues} issue events), showing product/requirements awareness.`);
  }
  if (e.projects.avgHealth >= 55) {
    p.push(`Tends to keep projects maintained and documented (avg health ${e.projects.avgHealth}/100).`);
  } else if (e.projects.items.length) {
    p.push(`Active building, though maintenance signals (docs/licensing/pushes) are mixed (avg health ${e.projects.avgHealth}/100).`);
  }
  if (e.primaryLanguages.length >= 3) {
    p.push(`Comfortable switching across ${e.primaryLanguages.length} languages, suggesting generalist flexibility.`);
  } else {
    p.push(`Concentrates on a focused stack (${e.primaryLanguages.slice(0, 2).join(', ') || 'one language'}), indicating depth over breadth.`);
  }
  return p.slice(0, 5);
}

// --- Trajectory --------------------------------------------------------------

function describeTrajectory(e: AiEvidence): string {
  const dir = e.trendDirection === 'up' ? 'rising' : e.trendDirection === 'down' ? 'declining' : 'stable';
  const recentLabel =
    e.recentActivity > 100 ? 'a very active recent month' : e.recentActivity > 30 ? 'an active recent month' : 'a quieter recent month';
  return `Trajectory is ${dir} (momentum ${e.momentum}). Public activity over the observation window points to ${recentLabel}, with overall growth ${e.momentum >= 15 ? 'accelerating' : e.momentum <= -10 ? 'cooling' : 'holding steady'}.`;
}

// --- Recommendations ----------------------------------------------------------

function buildRecommendations(e: AiEvidence): AiProfile['recommendations'] {
  const r: AiProfile['recommendations'] = [];

  if (e.subScores.collaboration < 55) {
    r.push({
      title: 'Increase open collaboration',
      detail: 'Contribute to shared repositories — open pull requests and review others’ work to raise collaboration signals.',
      impact: 'high',
      effort: 'low',
    });
  }
  if (e.projects.avgHealth < 60 && e.projects.items.length) {
    r.push({
      title: 'Harden project delivery',
      detail: 'Add licenses, READMEs, and CI to dormant repositories to lift average project health from its current level.',
      impact: 'medium',
      effort: 'medium',
    });
  }
  if (e.subScores.diversity < 55) {
    r.push({
      title: 'Broaden the technology palette',
      detail: 'Try one adjacent language or framework to diversify beyond the current primary stack.',
      impact: 'medium',
      effort: 'medium',
    });
  }
  const topGap = e.primaryLanguages[0];
  if (topGap) {
    r.push({
      title: `Go deeper in ${topGap}`,
      detail: `Investment in ${topGap} appears central to the profile; deepening it raises differentiation.`,
      impact: 'medium',
      effort: 'low',
    });
  }
  if (!r.length) {
    r.push({
      title: 'Publish more polished work',
      detail: 'Keep shipping; adding polished, documented flagship repositories will sharpen the profile further.',
      impact: 'medium',
      effort: 'medium',
    });
  }
  return r;
}