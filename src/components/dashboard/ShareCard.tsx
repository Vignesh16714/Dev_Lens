'use client';

import { Star, GitCommitHorizontal, CalendarDays } from 'lucide-react';
import type { IntelligenceReport } from '@/lib/types';
import { Avatar } from './Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';

export function ShareCard({ report }: { report: IntelligenceReport }) {
  const u = report.user;
  const top = report.metrics.primaryLanguages.slice(0, 4);
  const recent = report.metrics.recentActivityCount;
  const activeRatio = Math.round(report.metrics.averageActiveRatio * 100);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-borderline bg-surface">
      <div className="h-1.5 w-full bg-accent" />
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar url={u?.avatarUrl} alt={u?.login ?? ''} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#e6edf3]">{u?.name ?? u?.login}</p>
              <p className="font-mono text-xs text-muted">@{u?.login}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Score</span>
            <ScoreRing value={report.intelligenceScore} size={54} strokeWidth={6} />
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-accent">{report.ai.persona}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{report.ai.summary}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {top.map((l) => <Badge key={l} tone="accent">{l}</Badge>)}
          {!top.length ? <Badge tone="muted">No languages</Badge> : null}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-borderline pt-4 text-center">
          <MiniStat icon={<Star className="h-3.5 w-3.5 text-muted" />} value={report.metrics.totalStars} label="Stars" />
          <MiniStat icon={<GitCommitHorizontal className="h-3.5 w-3.5 text-muted" />} value={report.metrics.totalCommits} label="Commits" />
          <MiniStat icon={<CalendarDays className="h-3.5 w-3.5 text-muted" />} value={`${activeRatio}%`} label="Active days" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t border-borderline bg-elevated/40 px-4 py-3 text-[10px] uppercase tracking-wider text-muted">
        DevLens · Developer Intelligence
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1">{icon}<span className="tabular text-sm font-semibold text-[#e6edf3]">{value}</span></div>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

export default ShareCard;