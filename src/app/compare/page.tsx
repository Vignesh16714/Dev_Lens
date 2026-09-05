'use client';

import { useState } from 'react';
import { GitCompareArrows, Search, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Skeleton';
import type { CompareResponse } from '@/lib/types';
import { scoreColor } from '@/components/ui/ScoreRing';
import Link from 'next/link';

export default function ComparePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputA: a, inputB: b }),
      });
      const json = (await res.json()) as CompareResponse;
      if (!json.ok) setError(json.error ?? 'Comparison failed.');
      else setResult(json);
    } catch {
      setError('Network error during comparison.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canva">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Logo />
        <Button variant="ghost" size="sm"><Link href="/">Back home</Link></Button>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-borderline bg-elevated text-accent">
            <GitCompareArrows className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[#e6edf3]">Compare GitHub profiles</h1>
            <p className="text-xs text-muted">Measurable metrics, side by side.</p>
          </div>
        </div>

        <form onSubmit={run} className="card card-pad">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <ProfileInput value={a} onChange={setA} placeholder="github.com/username A" label="Profile A" />
            <div className="flex items-center justify-center sm:self-end sm:pb-1">
              <span className="text-muted">vs</span>
            </div>
            <ProfileInput value={b} onChange={setB} placeholder="github.com/username B" label="Profile B" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" size="md" loading={loading} disabled={!a.trim() || !b.trim()}>
              {!loading ? <Search className="h-4 w-4" /> : null}
              Compare profiles
            </Button>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        </form>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
            <Spinner className="h-4 w-4 text-accent" /> Comparing…
          </div>
        ) : null}

        {result && result.a && result.b ? (
          <div className="mt-8 space-y-4 animate-slide-up">
            <div className="grid gap-3 sm:grid-cols-2">
              <CompareHeader name={result.a.login} score={result.a.intelligenceScore} side="A" />
              <CompareHeader name={result.b.login} score={result.b.intelligenceScore} side="B" />
            </div>

            <Card className="card-pad">
              <div className="space-y-4">
                {result.dimensions?.map((d) => (
                  <CompareRow key={d.key} label={d.label} a={d.a} b={d.b} note={d.note} />
                ))}
              </div>
            </Card>

            <div className="flex items-start gap-2 rounded-md border border-borderline bg-elevated/40 p-3 text-[11px] leading-relaxed text-muted">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{result.disclaimer}</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ProfileInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function CompareHeader({ name, score, side }: { name: string; score: number; side: 'A' | 'B' }) {
  return (
    <Card className="card-pad flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted">Profile {side}</p>
        <p className="font-mono text-sm font-semibold text-[#e6edf3]">@{name}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-semibold tabular" style={{ color: scoreColor(score) }}>{score}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted">Score</p>
      </div>
    </Card>
  );
}

function CompareRow({ label, a, b, note }: { label: string; a: number; b: number; note: string }) {
  const max = Math.max(a, b, 1);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#c9d1d9]">{label}</span>
        <span className="text-muted">{note}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Track value={a} max={max} align="right" color="#58a6ff" />
        <span className="text-[10px] text-muted">vs</span>
        <Track value={b} max={max} align="left" color="#3fb950" />
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] tabular text-muted">
        <span className="ml-auto order-1">{a.toLocaleString()}</span>
        <span>{b.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Track({ value, max, align, color }: { value: number; max: number; align: 'left' | 'right'; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
      <div
        className={`h-full rounded-full ${align === 'right' ? 'ml-auto' : ''}`}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}