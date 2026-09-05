'use client';

import {
  TrendingUp, Rocket, Boxes, LineChart as LineIcon,
} from 'lucide-react';
import { useReport } from './useReport';
import { Section, StatCard } from './Section';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

export function GrowthView() {
  const { report } = useReport();
  const g = report.growth;
  const m = report.metrics;

  // Build per-language share series from techTrends (already grouped by interval).
  const langSeries = new Map<string, { label: string; value: number }[]>();
  for (const t of g.techTrends) {
    const arr = langSeries.get(t.language) ?? [];
    arr.push({ label: t.interval, value: t.share });
    langSeries.set(t.language, arr);
  }
  const topLangs = Array.from(langSeries.entries())
    .sort((a, b) => b[1].reduce((s, p) => s + p.value, 0) - a[1].reduce((s, p) => s + p.value, 0))
    .slice(0, 4);

  const creation = g.projectCreationTimeline.map((c) => ({ label: c.month, value: c.count, highlight: false }));
  const trend = g.activityTrend.map((t) => ({ label: t.month, value: t.count }));

  const trendTone = g.trajectory.momentum >= 15 ? 'green' : g.trajectory.momentum <= -10 ? 'danger' : 'default';

  return (
    <div className="space-y-5">
      <Section title="Growth" subtitle="Technology evolution and developer trajectory" icon={TrendingUp} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Momentum" value={`${g.trajectory.momentum}`} icon={Rocket} tone={trendTone === 'green' ? 'green' : trendTone === 'danger' ? 'danger' : 'accent'} hint="vs prior periods" />
        <StatCard label="Languages" value={m.totalLanguages} icon={Boxes} />
        <StatCard label="Rising tech" value={g.languageCategories.filter((c) => c.trend === 'rising').length} icon={TrendingUp} tone="green" />
        <StatCard label="Trajectory" value={g.trajectory.label} icon={Rocket} />
      </div>

      <Card className="card-pad">
        <Badge tone={trendTone === 'green' ? 'green' : trendTone === 'danger' ? 'danger' : 'default'} className="mb-2">
          {g.trajectory.label}
        </Badge>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">{g.trajectory.summary}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Activity trend" subtitle="Monthly contribution events" />
          <CardBody><LineChart data={trend} height={190} valueFormatter={(v) => String(v)} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Project creation" subtitle="New repositories per year" />
          <CardBody><BarChart data={creation} height={190} barColor="#58a6ff" /></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Technology evolution"
          subtitle="Share of each language across half-year periods"
          action={<div className="flex items-center gap-1 text-xs text-muted"><LineIcon className="h-3.5 w-3.5" />share of lines</div>}
        />
        <CardBody>
          <div className="grid gap-6 sm:grid-cols-2">
            {topLangs.map(([lang, series]) => (
              <div key={lang}>
                <p className="mb-1 text-xs font-semibold text-[#e6edf3]">{lang}</p>
                <LineChart data={series} height={120} valueFormatter={(v) => `${v.toFixed(0)}%`} />
              </div>
            ))}
            {!topLangs.length ? <p className="py-6 text-center text-xs text-muted">Not enough history to show technology evolution.</p> : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Language categories" subtitle="How each technology trended over time" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-borderline text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4 font-medium">Language</th>
                  <th className="py-2 pr-4 font-medium">First seen</th>
                  <th className="py-2 pr-4 font-medium">Peak share</th>
                  <th className="py-2 pr-4 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderline/60">
                {g.languageCategories.map((c) => (
                  <tr key={c.language}>
                    <td className="py-2.5 pr-4 font-medium text-[#e6edf3]">{c.language}</td>
                    <td className="py-2.5 pr-4 text-muted">{c.firstSeen}</td>
                    <td className="py-2.5 pr-4 tabular text-muted">{c.peakShare}%</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={c.trend === 'rising' ? 'green' : c.trend === 'declining' ? 'danger' : c.trend === 'new' ? 'accent' : 'muted'}>
                        {c.trend}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!g.languageCategories.length ? (
                  <tr><td className="py-4 text-center text-xs text-muted" colSpan={4}>No language history available.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}