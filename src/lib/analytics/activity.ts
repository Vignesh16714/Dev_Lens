import type {
  ActivityAnalysis,
  ContributionDay,
  EventActivity,
  WeeklyActivity,
} from '../types';
import type { Dataset } from '../normalize';
import { contributionLevel, eventLabel } from '../normalize/events';
import { clamp } from './util';

export interface ActivityComputed {
  activity: ActivityAnalysis;
  metrics: {
    totalCommits: number;
    githubReportedEvents: number;
    activeDays: number;
    uniqueDays: number;
    averageActiveRatio: number;
    recentActivityCount: number;
  };
}

const OBSERVE = 365; // days of heatmap

function dateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function computeActivity(dataset: Dataset): ActivityComputed {
  const events = dataset.events;
  const now = Date.now();

  // --- 365-day full heatmap grid -------------------------------
  const countByDay = new Map<string, number>();
  for (const e of events) {
    const ts = new Date(e.iso).getTime();
    if (now - ts > OBSERVE * 86_400_000) continue;
    countByDay.set(e.date, (countByDay.get(e.date) ?? 0) + 1);
  }
  const start = now - (OBSERVE - 1) * 86_400_000;
  const heatmap: ContributionDay[] = [];
  let activeDays = 0;
  for (let d = 0; d < OBSERVE; d++) {
    const ts = start + d * 86_400_000;
    const key = dateKey(ts);
    const val = countByDay.get(key) ?? 0;
    if (val > 0) activeDays++;
    heatmap.push({ date: key, count: val, level: contributionLevel(val) });
  }

  // --- Monthly series (last 12 calendar months) ----------------
  const monthlyMap = new Map<string, { commits: number; events: number }>();
  for (const e of events) {
    const ym = `${e.date.slice(0, 4)}-${e.date.slice(5, 7)}`;
    const m = monthlyMap.get(ym) ?? { commits: 0, events: 0 };
    m.events += 1;
    monthlyMap.set(ym, m);
  }
  const monthlyEntries = Array.from(monthlyMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const monthlySeries = monthlyEntries.slice(-12).map(([month]) => ({
    month: monthLabel2(month),
    commits: 0,
    events: monthlyMap.get(month)!.events,
  }));

  // --- Weekly activity -----------------------------------------
  const weeklyMap = new Map<string, number>();
  for (const e of events) {
    const ts = new Date(e.iso).getTime();
    const weekStart = ts - new Date(e.iso).getUTCDay() * 86_400_000;
    weeklyMap.set(dateKey(weekStart), (weeklyMap.get(dateKey(weekStart)) ?? 0) + 1);
  }
  const weeklySeries: WeeklyActivity[] = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-52)
    .map(([weekStart, count]) => ({ weekStart, count }));
// --- Hour histogram -------------------------------------------
  const hourCount = new Array(24).fill(0) as number[];
  for (const e of events) hourCount[e.hour] = (hourCount[e.hour] ?? 0) + 1;
  const commitByHour = hourCount.map((count, hour) => ({ hour, count }));

  // --- Most active periods --------------------------------------
  const byWeekday = new Array(7).fill(0) as number[];
  const weekdayKeys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const e of events) byWeekday[new Date(e.iso).getUTCDay()] += 1;
  const mostWD = byWeekday.indexOf(Math.max(...byWeekday));
  const mostActiveDay = mostWD >= 0 ? weekdayKeys[mostWD] : null;

  const peakBucket = hourCount.indexOf(Math.max(...hourCount));
  const mostActiveTime =
    peakBucket >= 0
      ? `${pad(peakBucket)}:00–${pad(peakBucket + 1)}:00`
      : null;

  const peakMonthEntry = monthlyEntries.length
    ? monthlyEntries.reduce((max, e) => (e[1].events > max[1].events ? e : max), monthlyEntries[0])
    : null;
  const peakMonth = peakMonthEntry ? monthLabel2(peakMonthEntry[0]) : null;

  // --- Trend: recent 3 months vs prior 3 -------------------------
  const trimmedMonthly = monthlyEntries.slice(-6);
  const recent = trimmedMonthly.slice(-3).reduce((s, [, v]) => s + v.events, 0);
  const prior = trimmedMonthly.slice(0, 3).reduce((s, [, v]) => s + v.events, 0);
  const trendDirection =
    recent === 0 && prior === 0
      ? ('flat' as const)
      : prior === 0
        ? ('up' as const)
        : recent / prior > 1.12
          ? ('up' as const)
          : recent / prior < 0.88
            ? ('down' as const)
            : ('flat' as const);

  // --- Derived metrics ------------------------------------------
  const totalCommits = dataset.commitEventsCount;
  const uniqueDays = OBSERVE;
  const averageActiveRatio = uniqueDays ? activeDays / uniqueDays : 0;
  const averageCommitsPerActiveDay = activeDays ? Math.round((totalCommits / activeDays) * 10) / 10 : 0;
  const averageWorkingHoursSpan = workingSpan(hourCount);

  const recentCutoff = now - 30 * 86_400_000;
  let recentActivityCount = 0;
  for (const e of events) if (new Date(e.iso).getTime() >= recentCutoff) recentActivityCount++;

  const eventBreakdown: EventActivity[] = dataset.eventBreakdown.map((b) => ({
    type: eventLabel(b.type),
    count: b.count,
  }));

  const activity: ActivityAnalysis = {
    heatmap,
    weeklySeries,
    monthlySeries,
    eventBreakdown,
    commitByHour,
    mostActiveDay,
    mostActiveTime,
    peakMonth,
    trendDirection,
    githubReported: {
      events: dataset.githubReported.events,
      contributedRepos: dataset.githubReported.contributedRepos,
      gistEvents: 0,
      commits: totalCommits,
      prs: dataset.githubReported.prCount,
      issues: dataset.githubReported.issueCount,
      reviews: dataset.githubReported.reviewCount,
    },
    devlensCalculated: {
      activeDays,
      averageActiveRatio: Math.round(averageActiveRatio * 10) / 10,
      averageCommitsPerActiveDay,
      averageWorkingHoursSpan,
    },
  };

  return {
    activity,
    metrics: {
      totalCommits,
      githubReportedEvents: dataset.githubReported.events,
      activeDays,
      uniqueDays,
      averageActiveRatio,
      recentActivityCount,
    },
  };
}

function monthLabel2(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, 1));
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Estimate the span of hours a developer is most active in (top-2 buckets). */
function workingSpan(hourCount: number[]): string {
  const ordered = hourCount
    .map((c, h) => ({ c, h }))
    .sort((a, b) => b.c - a.c)
    .filter((x) => x.c > 0);
  if (!ordered.length) return '—';
  const top2 = ordered.slice(0, 2).map((x) => x.h).sort((a, b) => a - b);
  const a = top2[0];
  const b = top2[top2.length - 1];
  const span = b - a;
  if (span <= 3) return `${pad(a)}:00–${pad(a + 3)}:00`;
  if (span <= 6) return `${pad(a)}:00–${pad(a + 6)}:00`;
  return `${pad(a)}:00–${pad(b)}:00`;
}

function pad(h: number): string {
  return String(Math.max(0, Math.min(23, h))).padStart(2, '0');
}

export const clampContribution = clamp;