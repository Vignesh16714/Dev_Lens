import type { ContributionDay, EventActivity } from '../types';
import type { RawEvent } from '../github/client';

export interface NormalizedEvent {
  type: string;
  date: string; // YYYY-MM-DD
  iso: string; // full ISO timestamp
  hour: number; // 0..23 in the contributor's local-ish hour (UTC fallback)
  repo: string; // owner/name
  public: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  PushEvent: 'Commits',
  PullRequestEvent: 'Pull requests',
  PullRequestReviewEvent: 'Reviews',
  PullRequestReviewCommentEvent: 'Review comments',
  IssuesEvent: 'Issues',
  IssueCommentEvent: 'Issue comments',
  WatchEvent: 'Stars given',
  ForkEvent: 'Forks',
  CreateEvent: 'Repositories created',
  DeleteEvent: 'Ref deleted',
  PublicEvent: 'Publicized',
  ReleaseEvent: 'Releases',
  GollumEvent: 'Wiki edits',
  MemberEvent: 'Membership',
  CommitsEvent: 'Commit comments',
  SponsorshipEvent: 'Sponsorships',
};

/** Deterministic level 0..4 used by the contribution heatmap. */
export function contributionLevel(count: number): number {
  if (count <= 0) return 0;
  if (count >= 1 && count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

export function normalizeEvents(raw: RawEvent[]): {
  events: NormalizedEvent[];
  heatmap: ContributionDay[];
  breakdown: EventActivity[];
} {
  const events: NormalizedEvent[] = raw.map((e) => {
    const d = new Date(e.created_at);
    return {
      type: e.type,
      date: d.toISOString().slice(0, 10),
      iso: e.created_at,
      hour: d.getUTCHours(),
      repo: e.repo?.name ?? 'unknown',
      public: Boolean(e.public),
    };
  });

  const heatmap = aggregateHeatmap(events);
  const breakdown = aggregateBreakdown(events);
  return { events, heatmap, breakdown };
}

export function aggregateHeatmap(events: NormalizedEvent[]): ContributionDay[] {
  const byDay = new Map<string, number>();
  for (const e of events) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + 1);
  }
  const out: ContributionDay[] = [];
  for (const [date, count] of byDay.entries()) {
    out.push({ date, count, level: contributionLevel(count) });
  }
  return out;
}

export function aggregateBreakdown(events: NormalizedEvent[]): EventActivity[] {
  const byType = new Map<string, number>();
  for (const e of events) {
    byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
  }
  return Array.from(byType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Sum Commit payload sizes as a close proxy for commits from push events. */
export function sumPushCommits(raw: RawEvent[]): number {
  return raw.reduce((sum, e) => {
    if (e.type === 'PushEvent') return sum + (e.payload?.size ?? 0);
    return sum;
  }, 0);
}