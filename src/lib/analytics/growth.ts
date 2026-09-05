import type {
  GrowthAnalysis,
  TechTrendPoint,
} from '../types';
import type { Dataset } from '../normalize';
import { avg, round1, clamp } from './util';

interface PeriodPoint {
  interval: string;
  byLang: Map<string, number>;
}

function periodKey(createdAt: string): { key: string; label: string } {
  const d = new Date(createdAt);
  const y = d.getUTCFullYear();
  const half = d.getUTCMonth() < 6 ? 'H1' : 'H2';
  return { key: `${y}-${half}`, label: `${String(y).slice(2)} ${half}` };
}

/** Build per-period language share so we can see tech evolving over time. */
function periodSeries(dataset: Dataset): PeriodPoint[] {
  const periods = new Map<string, Map<string, number>>();
  for (const repo of dataset.repos) {
    const langs = dataset.repoLanguages.find(
      (l) => l.repoFullName === repo.fullName
    )?.languages;
    if (!langs || !langs.length) continue;
    const { key } = periodKey(repo.createdAt);
    const bucket = periods.get(key) ?? new Map<string, number>();
    for (const l of langs) bucket.set(l.language, (bucket.get(l.language) ?? 0) + l.bytes);
    periods.set(key, bucket);
  }
  return Array.from(periods.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([interval, byLang]) => ({ interval, byLang }));
}

interface LangRec {
  first: string;
  last: string;
  marks: { period: string; share: number }[];
}

export function computeGrowth(
  dataset: Dataset,
  monthlyActivity: { month: string; count: number }[]
): GrowthAnalysis {
  const series = periodSeries(dataset);

  const shares: TechTrendPoint[] = [];
  const langSeen: Record<string, LangRec> = {};
  series.forEach((per, idx) => {
    const total = Array.from(per.byLang.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return;
    for (const [lang, bytes] of per.byLang.entries()) {
      const share = (bytes / total) * 100;
      const prevTotal = idx > 0 ? Array.from(series[idx - 1].byLang.values()).reduce((s, v) => s + v, 0) : 0;
      const prevShare = prevTotal > 0 ? ((series[idx - 1].byLang.get(lang) ?? 0) / prevTotal) * 100 : 0;
      const delta = share - prevShare;
      shares.push({
        language: lang,
        interval: per.interval,
        share: round1(share),
        tokens: bytes,
        delta: round1(delta),
        direction: Math.abs(delta) < 2 ? 'flat' : delta > 0 ? 'up' : 'down',
      });
      const rec = langSeen[lang] ?? { first: per.interval, last: per.interval, marks: [] };
      if (per.interval < rec.first) rec.first = per.interval;
      if (per.interval > rec.last) rec.last = per.interval;
      rec.marks.push({ period: per.interval, share });
      langSeen[lang] = rec;
    }
  });

  // Per-language summary categories.
  const languageCategories = Object.entries(langSeen).map(([language, rec]) => {
    const latest = rec.marks[rec.marks.length - 1]?.share ?? 0;
    const prev = rec.marks[rec.marks.length - 2]?.share ?? 0;
    const peak = maxShare(rec.marks);
    const rising = rec.marks.length >= 2 && latest > prev + 3 && latest === peak;
    const declining = rec.marks.length >= 2 && latest < prev - 3;
    const trend: 'rising' | 'established' | 'declining' | 'new' = rising
      ? 'rising'
      : declining
        ? 'declining'
        : rec.marks.length < 2
          ? 'new'
          : 'established';
    return {
      language,
      firstSeen: rec.first,
      lastSeen: rec.last,
      peakShare: round1(peak),
      trend,
    };
  });

  // Project creation timeline by year.
  const creationMap = new Map<string, number>();
  for (const r of dataset.repos) {
    const y = new Date(r.createdAt).getUTCFullYear();
    creationMap.set(String(y), (creationMap.get(String(y)) ?? 0) + 1);
  }
  const projectCreationTimeline = Array.from(creationMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  const moving = momentumScore(dataset, monthlyActivity);
  const trajectory = {
    label: trajectoryLabel(moving),
    summary: trajectorySummary(moving, dataset, series),
    momentum: moving,
  };

  return {
    techTrends: shares,
    projectCreationTimeline,
    activityTrend: monthlyActivity,
    trajectory,
    languageCategories,
  };
}

function maxShare(marks: { share: number }[]): number {
  return marks.reduce((m, x) => Math.max(m, x.share), 0);
}
/** -100..100 momentum based on activity trend + technology expansion. */
function momentumScore(
  dataset: Dataset,
  monthly: { month: string; count: number }[]
): number {
  const counts = monthly.slice(-6).map((m) => m.count);
  if (!counts.length) return 0;
  const recent = counts.slice(-3).reduce((s, c) => s + c, 0);
  const prior = counts.slice(0, 3).reduce((s, c) => s + c, 0);
  const activityDelta = prior === 0 ? (recent > 0 ? 1 : 0) : (recent - prior) / prior;
  const langTrend = dataset.languageMix.length;
  const expansion = clamp((langTrend - 2) * 6, -30, 30);
  const raw = activityDelta * 60 + expansion;
  return clamp(Math.round(raw), -100, 100);
}

function trajectoryLabel(m: number): string {
  if (m >= 40) return 'Rapidly accelerating';
  if (m >= 15) return 'Strong upward trajectory';
  if (m >= -10) return 'Steady, consistent';
  if (m >= -40) return 'Plateauing';
  return 'Declining momentum';
}

function trajectorySummary(
  m: number,
  dataset: Dataset,
  series: PeriodPoint[]
): string {
  const langs = series.reduce((n, p) => Math.max(n, p.byLang.size), 0);
  const periods = series.length;
  const parts: string[] = [];
  parts.push(
    m >= 15
      ? `Trajectory is trending upward with momentum of +${m}.`
      : m <= -40
        ? `Recent activity has cooled (momentum ${m}).`
        : m <= -10
          ? `Development pace has plateaued (momentum ${m}).`
          : `Development pace is steady (momentum ${m}).`
  );
  parts.push(
    `Observed ${langs} distinct ${langs === 1 ? 'technology' : 'technologies'} across ${periods} ${periods === 1 ? 'period' : 'periods'}.`
  );
  return parts.join(' ');
}

export const growthAvg = avg;
export const growthClamp = clamp;