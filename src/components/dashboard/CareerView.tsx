'use client';

import { useState } from 'react';
import { Briefcase, Target, Check, X, ArrowRight, Info } from 'lucide-react';
import { useReport } from './useReport';
import { Section } from './Section';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import type { RoleKey } from '@/lib/types';

const ROLE_ORDER: RoleKey[] = ['frontend', 'backend', 'fullstack', 'ai', 'cloud', 'devops'];

export function CareerView() {
  const { report, career } = useReport();
  const [selected, setSelected] = useState<RoleKey>(career.topRole);
  const role = career.roles.find((r) => r.roleKey === selected) ?? career.roles[0];

  const sorted = [...career.roles].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-5">
      <Section
        title="Career readiness"
        subtitle="Role-specific fit from detected technologies and measurable patterns"
        icon={Briefcase}
        action={<Badge tone="muted">based on public signals only</Badge>}
      />

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {sorted.map((r) => {
          const active = r.roleKey === selected;
          return (
            <button
              key={r.roleKey}
              onClick={() => setSelected(r.roleKey)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                active ? 'border-accent/60 bg-elevated text-[#e6edf3]' : 'border-borderline text-muted hover:bg-elevated/50 hover:text-[#e6edf3]'
              }`}
            >
              <span className="tabular font-semibold">{r.score}</span>
              <span>{r.roleLabel}</span>
              {r.roleKey === career.topRole ? <Badge tone="green" className="text-[9px]">TOP</Badge> : null}
            </button>
          );
        })}
      </div>

      {role ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="card-pad flex flex-col items-center justify-center py-8 lg:col-span-1">
            <p className="label mb-4">Readiness for {role.roleLabel}</p>
            <ScoreRing value={role.score} size={140} strokeWidth={9} sublabel="/ 100" />
            <p className="mt-5 text-center text-xs leading-relaxed text-muted">{role.matchedBy}</p>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardBody>
                <div className="mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#3fb950]" />
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Detected strengths</h3>
                </div>
                {role.foundStrengths.length ? (
                  <div className="flex flex-wrap gap-2">
                    {role.foundStrengths.map((s) => <Badge key={s} tone="green">{s}</Badge>)}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No overlapping languages detected for this role yet.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="mb-2 flex items-center gap-2">
                  <X className="h-4 w-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Skill gaps</h3>
                </div>
                {role.gaps.length ? (
                  <ul className="space-y-2">
                    {role.gaps.map((g) => (
                      <li key={g.skill} className="flex items-center gap-2 text-xs">
                        <span className="rounded border border-borderline bg-elevated px-2 py-0.5 font-mono text-[#c9d1d9]">{g.skill}</span>
                        <span className="text-muted">{g.note}</span>
                        {g.critical ? <Badge tone="warning">critical</Badge> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">No significant gaps detected.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Recommended next steps</h3>
                </div>
                <ol className="space-y-1.5">
                  {role.nextSteps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#c9d1d9]">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-borderline text-[10px] text-muted">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-2 text-[11px] text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Readiness scores reflect technologies detected in public repositories and measurable collaboration/consistency metrics. They are directional signals for self-review, not employment suitability assessments.</span>
      </div>
    </div>
  );
}