'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Home, Activity, FolderGit2, TrendingUp, BrainCircuit, Briefcase,
  GitCompareArrows, Share2, Menu, X, RefreshCw, Github, Database, ExternalLink,
} from 'lucide-react';
import { AnalysisProvider, useAnalysis } from '@/context/AnalysisContext';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: RegExp;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Home, match: /^\/dashboard$/ },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, match: /^\/dashboard\/activity/ },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderGit2, match: /^\/dashboard\/projects/ },
  { href: '/dashboard/growth', label: 'Growth', icon: TrendingUp, match: /^\/dashboard\/growth/ },
  { href: '/dashboard/ai', label: 'AI Intelligence', icon: BrainCircuit, match: /^\/dashboard\/ai/ },
  { href: '/dashboard/career', label: 'Career', icon: Briefcase, match: /^\/dashboard\/career/ },
  { href: '/dashboard/share', label: 'Share card', icon: Share2, match: /^\/dashboard\/share/ },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows, match: /^\/compare/ },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<FullShellLoader />}>
      <ShellLoader>{children}</ShellLoader>
    </Suspense>
  );
}

function ShellLoader({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const username = sp.get('u') ?? 'vercel';
  return (
    <AnalysisProvider username={username}>
      <ShellInner>{children}</ShellInner>
    </AnalysisProvider>
  );
}

function FullShellLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canva">
      <Skeleton className="h-8 w-48" />
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { status, data, error, refresh } = useAnalysis();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const uname = data?.requestedUsername ?? '';
  const q = useMemo(() => (uname ? `?u=${encodeURIComponent(uname)}` : ''), [uname]);
  const refreshing = status === 'loading';

  const doRefresh = useCallback(() => {
    if (!refreshing) void refresh();
  }, [refresh, refreshing]);

  return (
    <div className="flex min-h-screen bg-canva">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-borderline bg-surface/40 lg:flex">
        <div className="px-4 py-5">
          <Link href="/"><Logo /></Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted">Developer report</p>
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} active={item.match.test(pathname)} q={item.href === '/compare' ? '' : q} />
          ))}
        </nav>
        <div className="border-t border-borderline p-4">
          {data ? <ProfileMini /> : <p className="text-xs text-muted">Loading profile…</p>}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-borderline bg-canva/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/"><Logo /></Link>
        <button className="rounded p-1.5 text-muted hover:text-[#e6edf3]" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-30 bg-canva lg:hidden">
          <nav className="flex h-full flex-col space-y-0.5 px-3 pt-16">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} active={item.match.test(pathname)} q={item.href === '/compare' ? '' : q} onNavigate={() => setMenuOpen(false)} />
            ))}
          </nav>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pl-60 lg:pt-0">
        <TopBar refreshing={refreshing} onRefresh={doRefresh} uname={uname} router={router} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {status === 'loading' || status === 'error' ? (
            <StateSkeleton status={status} error={error} />
          ) : (
            <div className="animate-fade-in">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item, active, q, onNavigate,
}: {
  item: NavItem;
  active: boolean;
  q: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={`${item.href}${q}`}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? 'bg-elevated text-[#e6edf3]' : 'text-muted hover:bg-elevated/60 hover:text-[#e6edf3]'}`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
    </Link>
  );
}
function TopBar({
  refreshing, onRefresh, uname, router,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  uname: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { sourceLabel } = useAnalysis();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-borderline bg-surface/30 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-borderline bg-elevated px-2 py-1">
          <Github className="h-3 w-3 text-accent" />
          <span className="truncate font-mono">{uname || '@'}</span>
        </span>
        <span className="hidden text-xs text-muted sm:block">{sourceLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </Button>
        {uname ? (
          <Button variant="secondary" size="sm" onClick={() => router.push(`/share/${encodeURIComponent(uname)}`)}>
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open share</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ProfileMini() {
  const { data } = useAnalysis();
  const u = data?.requestedUsername;
  const score = data?.report?.intelligenceScore;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-borderline bg-elevated text-accent">
        <Github className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[#e6edf3]">@{u ?? '…'}</p>
        <p className="text-[10px] text-muted">Score {score ?? '—'} / 100</p>
      </div>
    </div>
  );
}

function StateSkeleton({ status, error }: { status: string; error: string | null }) {
  return (
    <div>
      {status === 'loading' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-default" />
            <Skeleton className="h-28 rounded-default" />
            <Skeleton className="h-28 rounded-default" />
            <Skeleton className="h-28 rounded-default" />
          </div>
          <Skeleton className="h-64 rounded-default" />
        </div>
      ) : (
        <div className="card card-pad text-center">
          <Database className="mx-auto mb-3 h-6 w-6 text-muted" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Couldn't load analysis</h2>
          <p className="mt-1 text-xs text-muted">{error ?? 'Something went wrong.'}</p>
        </div>
      )}
    </div>
  );
}