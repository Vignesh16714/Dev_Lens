'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GitBranch,
  Activity,
  Layers,
  Users,
  TrendingUp,
  BrainCircuit,
  Briefcase,
  GitCompareArrows,
  Share2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const DEMOS = ['microsoft', 'vercel', 'octocat', 'torvalds'];

export function LandingPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val) {
      setError('Enter a GitHub username or profile URL.');
      return;
    }
    setError(null);
    router.push(`/analyze?u=${encodeURIComponent(val)}`);
  }

  return (
    <div className="min-h-screen bg-canva">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm text-muted md:flex">
          <Link className="rounded px-3 py-1.5 hover:text-[#e6edf3]" href="#features">Features</Link>
          <Link className="rounded px-3 py-1.5 hover:text-[#e6edf3]" href="#how">How it works</Link>
        </nav>
        <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard?u=vercel')}>
          Live demo
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="pt-16 pb-10 text-center md:pt-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-borderline bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
            Developer Intelligence Platform
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-[#e6edf3] md:text-6xl">
            See the developer behind the GitHub profile.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted md:text-lg">
            DevLens turns public GitHub data into a precise, evidence-based
            intelligence report — activity, project quality, technology
            evolution, collaboration, growth, AI insight and career readiness.
          </p>

          <form onSubmit={submit} className="mx-auto mt-9 max-w-xl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="github.com/username  or  @username"
                  className="pl-9 text-sm"
                  aria-label="GitHub username or profile URL"
                />
              </div>
              <Button type="submit" size="lg" className="whitespace-nowrap">
                Analyze Developer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {error ? <p className="mt-2 text-left text-sm text-red-400">{error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
              <span>Try a profile:</span>
              {DEMOS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setInput(d)}
                  className="rounded border border-borderline bg-elevated px-2 py-1 font-mono text-[11px] text-[#c9d1d9] transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {d}
                </button>
              ))}
            </div>
          </form>
        </section>

        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-default border border-borderline bg-borderline md:grid-cols-4">
          {[
            ['Live + cached analysis', 'Strict server-side data layer'],
            ['Score, never assumed', 'Every metric is measurable'],
            ['8 intelligence modules', 'Activity → Career readiness'],
            ['Works without API keys', 'Automatic demo-data fallback'],
          ].map(([a, b]) => (
            <div key={a} className="bg-surface px-5 py-5">
              <p className="text-sm font-semibold text-[#e6edf3]">{a}</p>
              <p className="mt-1 text-xs text-muted">{b}</p>
            </div>
          ))}
        </section>

        <section id="features" className="mt-20 scroll-mt-20">
          <div className="mb-8 flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-[#e6edf3]">Everything, from one public profile</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Activity, 'Activity intelligence', 'Contribution heatmaps, commit trends and patterns from measurable signals.'],
              [Layers, 'Project health', 'Per-repository health from recency, attention, hygiene, licensing and docs.'],
              [TrendingUp, 'Technology evolution', 'See which languages are rising or fading across a developer’s history.'],
              [Users, 'Collaboration', 'PRs, reviews and issue activity — how a developer works with others.'],
              [BrainCircuit, 'AI intelligence', 'Evidence-based personas, strengths, weaknesses and recommendations.'],
              [Briefcase, 'Career readiness', 'Role-specific readiness for frontend, backend, AI, cloud and DevOps.'],
              [GitCompareArrows, 'Compare profiles', 'Fair, metric-based comparisons with clear limitations disclosed.'],
              [Share2, 'Shareable cards', 'A public profile card you can share with a single URL.'],
            ].map(([Icon, title, desc]) => (
              <Card key={title as string} className="card-pad transition-colors hover:border-accent/30">
                <Icon className="mb-3 h-5 w-5 text-accent" />
                <h3 className="text-sm font-semibold text-[#e6edf3]">{title as string}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{desc as string}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how" className="mt-20 scroll-mt-20">
          <h2 className="mb-8 text-xl font-semibold text-[#e6edf3]">How DevLens works</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['01', 'Fetch & normalize', 'GitHub public data is pulled server-side, paginated, rate-limit-aware and cached. No secrets reach the browser.'],
              ['02', 'Measure & score', 'Deterministic analytics convert raw signals into a transparent Developer Intelligence Score with per-dimension breakdowns.'],
              ['03', 'Synthesize & act', 'An evidence-gated AI layer writes the persona, strengths and next steps — always grounded in measured metrics.'],
            ].map(([n, t, d]) => (
              <Card key={n} className="card-pad">
                <span className="font-mono text-xs text-muted">{n}</span>
                <h3 className="mt-2 text-sm font-semibold text-[#e6edf3]">{t}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{d}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-borderline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted md:flex-row">
          <span>DevLens — Developer Intelligence Platform.</span>
          <span>Comparisons reflect public GitHub signals, not overall developer quality.</span>
        </div>
      </footer>
    </div>
  );
}