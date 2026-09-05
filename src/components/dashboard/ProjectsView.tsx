'use client';

import { useState } from 'react';
import {
  FolderGit2, Star, GitFork, Code2, HeartPulse, Clock, Archive, ChevronDown,
} from 'lucide-react';
import { useReport } from './useReport';
import { Section, StatCard } from './Section';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Donut } from '@/components/charts/Donut';
import { fmtInt, fmtAge } from '@/lib/analytics/util';
import type { ProjectItem } from '@/lib/types';

export function ProjectsView() {
  const { report } = useReport();
  const p = report.projects;
  const [openId, setOpenId] = useState<number | null>(null);

  const donutData = p.languageMix.slice(0, 6).map((l) => ({ label: l.language, value: l.percent }));

  return (
    <div className="space-y-5">
      <Section
        title="Projects"
        subtitle="Repository quality, activity and project health"
        icon={FolderGit2}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total stars" value={fmtInt(p.totalStars)} icon={Star} tone="warning" />
        <StatCard label="Avg health" value={`${p.avgHealth}/100`} icon={HeartPulse} tone={p.avgHealth >= 55 ? 'green' : 'danger'} hint="across analyzed repos" />
        <StatCard label="Avg maintenance" value={`${p.avgMaintenance}/100`} icon={Clock} />
        <StatCard label="Stale / archived" value={`${p.staleCount}`} icon={Archive} tone={p.staleCount > 1 ? 'danger' : 'accent'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-pad lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Language mix</h3>
            <Badge tone="muted">by bytes</Badge>
          </div>
          <Donut data={donutData} size={160} centerLabel={`${p.items.length}`} valueFormatter={(v) => `${v.toFixed(0)}%`} />
        </Card>

        <div className="space-y-3 lg:col-span-2">
          {p.items.slice(0, 20).map((it) => (
            <RepoCard key={it.repo.id} it={it} open={openId === it.repo.id} onToggle={() => setOpenId(openId === it.repo.id ? null : it.repo.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RepoCard({ it, open, onToggle }: { it: ProjectItem; open: boolean; onToggle: () => void }) {
  const r = it.repo;
  const dt = r.pushedAt ? new Date(r.pushedAt) : null;
  const healthTone = it.health.score >= 70 ? 'green' : it.health.score >= 45 ? 'accent' : it.health.score >= 30 ? 'warning' : 'danger';
  const mtTone = it.maintenance === 'active' ? 'green' : it.maintenance === 'steady' ? 'accent' : it.maintenance === 'stale' ? 'warning' : 'muted';

  return (
    <Card className="overflow-hidden">
      <button className="w-full text-left" onClick={onToggle} aria-expanded={open}>
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-sm font-semibold text-[#e6edf3]">{r.name}</span>
              {r.fork ? <Badge tone="muted">fork</Badge> : null}
              {r.archived ? <Badge tone="muted">archived</Badge> : null}
            </div>
            {r.description ? <p className="mt-0.5 line-clamp-1 text-xs text-muted">{r.description}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{fmtInt(r.stargazersCount)}</span>
              <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" />{fmtInt(r.forksCount)}</span>
              {r.language ? <span className="inline-flex items-center gap-1"><Code2 className="h-3 w-3" />{r.language}</span> : null}
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmtAge(it.ageDays)} old</span>
              {dt ? <span>Updated {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
            <span className="tabular text-xl font-semibold text-[#e6edf3]">{it.health.score}</span>
            <Badge tone={mtTone}>{it.maintenance}</Badge>
            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
      {open ? (
        <div className="border-t border-borderline/60 px-4 py-4 animate-fade-in">
          <p className="label mb-3">Project health · {it.health.score}/100</p>
          <div className="space-y-2.5">
            {it.health.factors.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[#c9d1d9]">{f.label}</span>
                  <span className="tabular text-muted">{f.value}/100 · {f.note}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
                  <div className="h-full rounded-full" style={{ width: `${f.value}%`, background: healthColor(f.value) }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <span>Weighted from recency, attention, issue hygiene, licensing and documentation.</span>
            <a href={r.htmlUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">Open on GitHub →</a>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function healthColor(v: number): string {
  if (v >= 70) return '#3fb950';
  if (v >= 45) return '#58a6ff';
  if (v >= 30) return '#d29922';
  return '#f85149';
}