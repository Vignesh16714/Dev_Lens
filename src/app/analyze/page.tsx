'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { PROGRESS_STEPS, type AnalyzeResponse } from '@/lib/types';
import { saveAnalysis } from '@/lib/client-storage';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

type StepStatus = 'pending' | 'active' | 'done';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function AnalyzeScreen({ input }: { input: string }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>(() =>
    Object.fromEntries(PROGRESS_STEPS.map((s) => [s.key, 'pending']))
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      const keys = PROGRESS_STEPS.map((s) => s.key);

      // Create an AbortController for the fetch so we can cancel on unmount
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s hard timeout

      const apiPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      })
        .then((r) => r.json() as Promise<AnalyzeResponse>)
        .catch(
          (err) =>
            ({
              ok: false,
              error:
                err instanceof Error && err.name === 'AbortError'
                  ? 'Analysis timed out — GitHub API may be slow or unreachable.'
                  : 'Network error while analyzing.',
              source: 'mock',
              cached: false,
              fetchedAt: '',
              requestedUsername: input,
            }) as AnalyzeResponse
        );

      // Run progress animation in parallel with the API call.
      // Animation completes in ~2.8s; if the API is still running, we show
      // a "still working" state rather than hanging silently.
      const totalAnimMs = keys.reduce((s, _, i) => s + (560 - i * 40), 0);

      try {
        // Race: API response vs animation completion
        const animPromise = (async () => {
          for (let i = 0; i < keys.length; i++) {
            if (cancelled) return;
            setStatuses((p) => ({ ...p, [keys[i]]: 'active' }));
            await sleep(560 - i * 40);
            if (cancelled) return;
            setStatuses((p) => ({ ...p, [keys[i]]: 'done' }));
          }
        })();

        const resp = await apiPromise;

        // If animation is still running and API returned quickly, wait for it
        if (!cancelled) {
          await animPromise;
        }

        if (cancelled) return;
        clearTimeout(timeoutId);

        if (resp.ok && resp.report) {
          const uname = resp.requestedUsername || input;
          saveAnalysis(uname, resp);
          await sleep(300);
          if (!cancelled) router.replace(`/dashboard?u=${encodeURIComponent(uname)}`);
        } else {
          setError(resp.error ?? 'Analysis failed. Please try again.');
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setError('An unexpected error occurred during analysis.');
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [input, router]);

  const doneCount = PROGRESS_STEPS.filter((s) => statuses[s.key] === 'done').length;
  const pct = Math.round((doneCount / PROGRESS_STEPS.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-canva">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-6">
        <Logo />
        <span className="font-mono text-xs text-muted">@{input}</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#e6edf3]">Analyzing developer</h1>
          <p className="mt-1 text-sm text-muted">Turning public GitHub data into developer intelligence.</p>
        </div>

        {error ? (
          <ErrorCard error={error} router={router} />
        ) : (
          <ProgressCard statuses={statuses} pct={pct} />
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {error
            ? 'Try a different username, or add a GITHUB_TOKEN and retry.'
            : 'Securely analyzed server-side and cached. GitHub-reported data is distinct from DevLens-calculated metrics.'}
        </p>
      </main>
    </div>
  );
}
function ProgressCard({ statuses, pct }: { statuses: Record<string, StepStatus>; pct: number }) {
  return (
    <div className="card overflow-hidden rounded-lg border border-borderline bg-surface">
      <ul className="divide-y divide-borderline/60">
        {PROGRESS_STEPS.map((s) => {
          const st = statuses[s.key];
          return (
            <li key={s.key} className="flex items-center gap-3 px-5 py-3.5">
              <StepGlyph status={st} />
              <span className={`text-sm ${st === 'done' ? 'text-muted line-through decoration-borderline' : st === 'active' ? 'text-[#e6edf3]' : 'text-muted/70'}`}>
                {s.label}
              </span>
              {st === 'active' ? (
                <Loader2 className="ml-auto h-4 w-4 animate-spin text-accent" />
              ) : st === 'done' ? (
                <span className="ml-auto text-xs text-[#3fb950]">Done</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="h-1 w-full bg-elevated">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'done')
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/20 text-[#3fb950]">
        <Check className="h-3 w-3" />
      </span>
    );
  if (status === 'active')
    return <span className="h-5 w-5 rounded-full border-2 border-accent/60 bg-accent/10" />;
  return <span className="h-5 w-5 rounded-full border border-borderline" />;
}

function ErrorCard({ error, router }: { error: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="card rounded-lg border border-borderline p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <XCircle className="h-5 w-5" />
      </div>
      <h2 className="text-sm font-semibold text-[#e6edf3]">Unable to analyze</h2>
      <p className="mt-1 text-xs text-muted">{error}</p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back home
        </Button>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    </div>
  );
}

function AnalyzeInner() {
  const sp = useSearchParams();
  const input = sp.get('u') ?? '';
  if (!input) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canva text-sm">
        <a href="/" className="text-accent underline">Back to home</a>
      </div>
    );
  }
  return <AnalyzeScreen input={input} />;
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canva">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      }
    >
      <AnalyzeInner />
    </Suspense>
  );
}