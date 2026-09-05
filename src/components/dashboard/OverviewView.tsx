'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  GitCommitHorizontal, FolderGit2, Star, Code2, Clock, MapPin, Link as LinkIcon,
  Sparkles, AlertCircle, ArrowRight, Users, TrendingUp, Activity, Home,
} from 'lucide-react';
import { useReport } from './useReport';
import { Section, StatCard, ProvenanceNote } from './Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Radar } from '@/components/charts/Radar';
import { Donut } from '@/components/charts/Donut';
import { Avatar } from './Avatar';
import { fmtInt, fmtAge } from '@/lib/analytics/util';

export function OverviewView() {
  const { report } = useReport();
  const m = report.metrics;

  const subAxis = [
    { label: 'Activity', value: report.subScores.activity },
    { label: 'Consistency', value: report.subScores.consistency },
    { label: 'Diversity', value: report.subScores.diversity },
    { label: 'Collab', value: report.subScores.collaboration },
    { label: 'Growth', value: report.subScores.growth },
  ];

  const donutData = useMemo(
    () =>
      m.languagesByShare
        .slice(0, 6)
        .map((l) => ({ label: l.language, value: l.percent })).concat(
          m.languagesByShare.length > 6
            ? [{ label: 'Other', value: Math.max(0, 100 - m.languagesByShare.slice(0, 6).reduce((s, l) => s + l.percent, 0)) }]
            : []
        ),
    [m.languagesByShare]
  ).filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <Section
        title={`${report.user?.name ?? report.user?.login ?? ''}`}
        subtitle="Developer Intelligence Overview"
        icon={Home}
      />

      {/* Profile card */}
      <ProfileCard />

      {/* Score + radar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-pad flex flex-col items-center justify-center py-8 text-center lg:col-span-1">
          <p className="label mb-4">Developer Intelligence Score</p>
          <ScoreRing value={report.intelligenceScore} size={150} strokeWidth={10} sublabel="/ 100" />
          <p className="mt-6 text-xs text-muted">
            Weighted from {report.intelligenceScore <= 0 ? 'limited' : 'transparent'} sub-scores below.
          </p>
          <div className="mt-3 w-full">
            <ScoreBreakdown />
          </div>
        </Card>

        <Card className="card-pad lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Dimension scores</h3>
            <Badge tone="muted">DevLens-calculated</Badge>
          </div>
          <Radar axes={subAxis} size={260} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {report.subScores ? (
              (['activity', 'consistency', 'diversity', 'collaboration', 'growth'] as const).map((k) => (
                <ScoreBar key={k} label={labelFor(k)} value={report.subScores[k]} />
              ))
            ) : null}
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Commits" value={fmtInt(m.totalCommits)} icon={GitCommitHorizontal} tone="accent" />
        <StatCard label="Repositories" value={fmtInt(m.totalRepos)} icon={FolderGit2} />
        <StatCard label="Stars" value={fmtInt(m.totalStars)} icon={Star} tone="warning" />
        <StatCard label="Languages" value={m.totalLanguages} icon={Code2} />
        <StatCard label="Active days" value={m.activeDays} icon={Activity} tone="green" hint={`${(m.averageActiveRatio * 100).toFixed(0)}% of year`} />
        <StatCard label="Recent (30d)" value={fmtInt(m.recentActivityCount)} icon={TrendingUp} />
      </div>

      {/* Tech + insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-pad">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Technology distribution</h3>
            <ProvenanceNote>based on analyzed repositories</ProvenanceNote>
          </div>
          {donutData.length ? (
            <Donut data={donutData} size={170} centerLabel={`${m.totalLanguages}`} valueFormatter={(v) => `${v.toFixed(0)}%`} />
          ) : (
            <p className="py-8 text-center text-xs text-muted">No language data available.</p>
          )}
        </Card>

        <Card className="card-pad">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Key insights</h3>
            <Badge tone="accent">AI · evidence-based</Badge>
          </div>
          <div className="space-y-3">
            {report.ai.strengths.slice(0, 2).map((s) => (
              <Insight key={s.title} icon={<Sparkles className="h-3.5 w-3.5 text-[#3fb950]" />} title={s.title} detail={s.detail} evidence={s.evidence} />
            ))}
            {report.ai.weaknesses.slice(0, 1).map((s) => (
              <Insight key={s.title} icon={<AlertCircle className="h-3.5 w-3.5 text-yellow-400" />} title={s.title} detail={s.detail} evidence={s.evidence} />
            ))}
          </div>
          <Link href="/dashboard/ai" className="group mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
            View AI intelligence
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}

function labelFor(k: string): string {
  switch (k) {
    case 'activity': return 'Activity';
    case 'consistency': return 'Consistency';
    case 'diversity': return 'Project Diversity';
    case 'collaboration': return 'Collaboration';
    case 'growth': return 'Growth';
    default: return k;
  }
}
function ProfileCard() {
  const { report } = useReport();
  const u = report.user;
  return (
    <Card className="card-pad">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar url={u?.avatarUrl} alt={u?.login ?? ''} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-[#e6edf3]">{u?.name ?? u?.login}</h2>
            <span className="font-mono text-sm text-muted">@{u?.login}</span>
          </div>
          {u?.bio ? <p className="mt-1 text-sm text-muted">{u.bio}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {u?.location ? (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{u.location}</span>
            ) : null}
            {u?.company ? (
              <span className="inline-flex items-center gap-1"><BriefcaseIcon />{u.company}</span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Account {fmtAge(report.metrics.accountAgeDays)} old
            </span>
            {u?.blog ? (
              <a href={u.blog} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                <LinkIcon className="h-3 w-3" /> {u.blog.replace(/^https?:\/\//, '')}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-6 text-center">
          <MetaStat value={u?.followers ?? 0} label="Followers" />
          <MetaStat value={u?.following ?? 0} label="Following" />
          <MetaStat value={report.metrics.totalRepos} label="Repos" />
        </div>
      </div>
    </Card>
  );
}

function MetaStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="tabular text-lg font-semibold text-[#e6edf3]">{fmtInt(value)}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M4.5 4V2.75A1.75 1.75 0 0 1 6.25 1h3.5A1.75 1.75 0 0 1 11.5 2.75V4h2.25a1.75 1.75 0 0 1 1.75 1.75v6.5A1.75 1.75 0 0 1 13.75 14h-11.5A1.75 1.75 0 0 1 .5 12.25v-6.5C.5 4.78 1.28 4 2.25 4H4.5ZM6 4h4V3a.5.5 0 0 0-.5-.5h-3A.5.5 0 0 0 6 3v1Z" />
    </svg>
  );
}

function ScoreBreakdown() {
  const { report } = useReport();
  const total = (report.intelligenceScore || 0);
  return (
    <div className="mt-2 space-y-1.5 text-left">
      {report.subScores ? (
        (['activity', 'consistency', 'diversity', 'collaboration', 'growth'] as const).map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-muted">{labelFor(k)}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, report.subScores[k]))}%`, background: scoreColorPct(report.subScores[k]) }}
              />
            </div>
            <span className="tabular w-7 text-right text-muted">{report.subScores[k]}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted">No sub-scores.</p>
      )}
      <p className="pt-1 text-[11px] text-muted">Composite = {total || 0}/100 weighted across dimensions.</p>
    </div>
  );
}

function scoreColorPct(v: number): string {
  if (v >= 75) return '#3fb950';
  if (v >= 55) return '#58a6ff';
  if (v >= 35) return '#d29922';
  return '#f85149';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 truncate text-xs text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: scoreColorPct(value) }} />
      </div>
      <span className="tabular w-7 text-right text-xs text-muted">{value}</span>
    </div>
  );
}

function Insight({
  icon, title, detail, evidence,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  evidence: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-borderline/60 bg-elevated/40 p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#e6edf3]">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
        <p className="mt-1 text-[10px] text-muted">Evidence: <span className="font-mono">{evidence}</span></p>
      </div>
    </div>
  );
}