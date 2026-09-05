'use client';

import {
  BrainCircuit, Sparkles, AlertTriangle, ListChecks, Compass,
  ThumbsUp, Eye, Code2,
} from 'lucide-react';
import { useReport } from './useReport';
import { Section } from './Section';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge, Dot } from '@/components/ui/Badge';

export function AiView() {
  const { report } = useReport();
  const ai = report.ai;

  return (
    <div className="space-y-5">
      <Section title="AI Intelligence" subtitle="An evidence-based developer profile" icon={BrainCircuit} />

      {/* Persona */}
      <Card className="card-pad">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-borderline bg-elevated text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label mb-1">Developer persona</p>
            <h2 className="text-lg font-semibold text-[#e6edf3]">{ai.persona}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#c9d1d9]">{ai.summary}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ai.provenance.map((p) => (
            <Badge key={p.label} tone="muted">{p.label}: <span className="ml-1 text-[#e6edf3]">{p.value}</span></Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <StrengthCard title="Strengths" items={ai.strengths} tone="green" />
        <WeaknessCard title="Areas to develop" items={ai.weaknesses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-[#e6edf3]">Development patterns</h3>
            </div>
            <ul className="space-y-2.5">
              {ai.patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#c9d1d9]">
                  <Dot className="mt-1" tone="muted" />
                  {p}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-[#e6edf3]">Current trajectory</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#c9d1d9]">{ai.trajectory}</p>
            <p className="mt-3 text-[11px] text-muted">Only claims supported by measured metrics are used. If the LLM is enabled, it only rewrites wording — it never invents facts.</p>
          </CardBody>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-[#e6edf3]">Recommended next steps</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ai.recommendations.map((r, i) => (
              <div key={i} className="rounded-md border border-borderline/60 bg-elevated/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#e6edf3]">{r.title}</p>
                  <div className="flex shrink-0 gap-1.5">
                    <Badge tone={r.impact === 'high' ? 'green' : r.impact === 'medium' ? 'accent' : 'muted'}>impact {r.impact}</Badge>
                    <Badge tone="muted">effort {r.effort}</Badge>
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{r.detail}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function StrengthCard({ title, items, tone }: { title: string; items: { title: string; detail: string; evidence: string }[]; tone?: 'green' | 'accent' }) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-[#3fb950]" />
          <h3 className="text-sm font-semibold text-[#e6edf3]">{title}</h3>
        </div>
        <div className="space-y-2.5">
          {items.map((s) => (
            <div key={s.title} className="rounded-md border border-borderline/60 bg-elevated/40 p-3">
              <p className="text-sm font-medium text-[#e6edf3]">{s.title}</p>
              <p className="mt-1 text-xs text-muted">{s.detail}</p>
              <p className="mt-1 text-[10px] text-muted">Evidence: <span className="font-mono">{s.evidence}</span></p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function WeaknessCard({ title, items }: { title: string; items: { title: string; detail: string; evidence: string }[] }) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-[#e6edf3]">{title}</h3>
        </div>
        <div className="space-y-2.5">
          {items.map((s) => (
            <div key={s.title} className="rounded-md border border-borderline/60 bg-elevated/40 p-3">
              <p className="text-sm font-medium text-[#e6edf3]">{s.title}</p>
              <p className="mt-1 text-xs text-muted">{s.detail}</p>
              <p className="mt-1 text-[10px] text-muted">Evidence: <span className="font-mono">{s.evidence}</span></p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}