'use client';

import { Activity, CalendarDays, Clock, GitCommitHorizontal, Calculator, Zap } from 'lucide-react';
import { useReport } from './useReport';
import { Section, StatCard, ProvenanceNote } from './Section';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ContributionHeatmap } from '@/components/charts/Heatmap';
import { BarChart } from '@/components/charts/BarChart';
import { fmtInt } from '@/lib/analytics/util';

export function ActivityView() {
  const { report } = useReport();
  const a = report.activity;

  const monthly = a.monthlySeries.map((m) => ({ label: m.month, value: m.events }));
  const weekly = a.weeklySeries.map((w) => ({
    label: new Date(`${w.weekStart}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    value: w.count,
    highlight: false,
  }));
  const hourly = a.commitByHour.map((h) => ({ label: `${h.hour}h`, value: h.count }));
  const breakdown = a.eventBreakdown.slice(0, 8);
  const maxEvent = breakdown.length ? Math.max(...breakdown.map((b) => b.count)) : 1;

  return (
    <div className="space-y-5">
      <Section
        title="Activity"
        subtitle="Contribution patterns, trends and timing"
        icon={Activity}
        action={
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="muted">GitHub-reported</Badge>
            <Badge tone="accent">DevLens-calculated</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Events reported" value={fmtInt(a.githubReported.events)} icon={Activity} hint="GitHub-reported" />
        <StatCard label="Commits observed" value={fmtInt(a.githubReported.commits)} icon={GitCommitHorizontal} hint="GitHub-reported" />
        <StatCard label="Active days" value={a.devlensCalculated.activeDays} icon={CalendarDays} tone="green" hint="DevLens-calculated" />
        <StatCard label="Avg active ratio" value={`${(a.devlensCalculated.averageActiveRatio * 100).toFixed(0)}%`} icon={Zap} hint="DevLens-calculated" />
      </div>

      <Card>
        <CardHeader
          title="Contribution heatmap"
          subtitle={`Last ${a.heatmap.length || 365} days`}
          action={<ProvenanceNote>events-based; GitHub public events window is ~90 days for live data</ProvenanceNote>}
        />
        <CardBody>
          <ContributionHeatmap data={a.heatmap.length ? a.heatmap : emptyHeatmap()} />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly activity" subtitle="Last 12 months" />
          <CardBody><BarChart data={monthly} height={180} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Weekly activity" subtitle="Contribution events per week" />
          <CardBody><BarChart data={weekly} height={180} barColor="#3fb950" /></CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Commit activity by hour" subtitle="UTC-normalized timing distribution" />
          <CardBody><BarChart data={hourly} height={180} barColor="#8b949e" valueFormatter={(v) => fmtInt(v)} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Activity mix" subtitle="What kind of activity dominates" />
          <CardBody>
            <div className="space-y-2">
              {breakdown.map((b) => (
                <div key={b.type} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 text-muted">{b.type}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(b.count / maxEvent) * 100}%` }}
                    />
                  </div>
                  <span className="tabular w-10 text-right text-[#c9d1d9]">{fmtInt(b.count)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-pad">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-[#e6edf3]">Most active periods</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PeriodStat label="Day of week" value={a.mostActiveDay ?? '—'} />
            <PeriodStat label="Time window" value={a.mostActiveTime ?? '—'} />
            <PeriodStat label="Peak month" value={a.peakMonth ?? '—'} />
            <PeriodStat label="Trend" value={trendLabel(a.trendDirection)} tone={a.trendDirection === 'up' ? 'green' : a.trendDirection === 'down' ? 'danger' : 'muted'} />
          </div>
        </Card>

        <Card className="card-pad">
          <div className="mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-[#e6edf3]">Data provenance</h3>
          </div>
          <div className="space-y-3 text-xs">
            <Origin title="GitHub reported" items={[
              `${fmtInt(a.githubReported.events)} public events`,
              `${fmtInt(a.githubReported.commits)} commit-derived`,
              `${fmtInt(a.githubReported.prs)} PRs · ${fmtInt(a.githubReported.issues)} issues · ${fmtInt(a.githubReported.reviews)} reviews`,
              `${a.githubReported.contributedRepos} repos contributed to`,
            ]} />
            <Origin title="DevLens calculated" items={[
              `${a.devlensCalculated.activeDays} active days in window`,
              `Avg ${a.devlensCalculated.averageCommitsPerActiveDay} commits per active day`,
              `Working span approx. ${a.devlensCalculated.averageWorkingHoursSpan}`,
            ]} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function emptyHeatmap() {
  const out: { date: string; count: number; level: number }[] = [];
  const start = Date.now() - 364 * 86_400_000;
  for (let i = 0; i < 365; i++) {
    out.push({ date: new Date(start + i * 86_400_000).toISOString().slice(0, 10), count: 0, level: 0 });
  }
  return out;
}

function trendLabel(t: 'up' | 'down' | 'flat'): string {
  return t === 'up' ? 'Rising' : t === 'down' ? 'Cooling' : 'Stable';
}

function PeriodStat({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'danger' | 'muted' }) {
  const c = tone === 'green' ? 'text-[#3fb950]' : tone === 'danger' ? 'text-red-400' : 'text-[#e6edf3]';
  return (
    <div className="rounded-md border border-borderline/60 bg-elevated/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${c}`}>{value}</p>
    </div>
  );
}

function Origin({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#c9d1d9]">{title}</p>
      <ul className="space-y-1 text-muted">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-borderline" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}