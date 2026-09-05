import type { CareerAnalysis, RoleKey, RoleReadiness, SubScores } from '../types';
import { clamp, round0 } from './util';

export interface CareerEvidence {
  languages: string[]; // primary + all observed languages
  subScores: SubScores;
  totalCommits: number;
  totalRepos: number;
  collaborationIndex: number; // 0..1
  momentum: number;
}

interface RoleSpec {
  key: RoleKey;
  label: string;
  languages: Record<string, number>; // language -> weight (1-3)
  note: string;
}

const ROLE_SPECS: RoleSpec[] = [
  {
    key: 'frontend',
    label: 'Frontend Developer',
    languages: { TypeScript: 3, JavaScript: 3, CSS: 2, HTML: 2, SCSS: 1 },
    note: 'UI languages: TypeScript / JavaScript plus CSS & HTML.',
  },
  {
    key: 'backend',
    label: 'Backend Developer',
    languages: { Python: 3, Go: 3, Java: 2, SQL: 2, TypeScript: 2, Ruby: 1, 'C++': 1, Shell: 1 },
    note: 'Server-side & data languages: Python / Go / Java / SQL.',
  },
  {
    key: 'fullstack',
    label: 'Full Stack Developer',
    languages: { TypeScript: 3, JavaScript: 3, Python: 2, CSS: 2, HTML: 2, Go: 1, SQL: 1 },
    note: 'Combines frontend languages with backend / server languages.',
  },
  {
    key: 'ai',
    label: 'AI Engineer',
    languages: { Python: 3, 'Jupyter Notebook': 3, 'C++': 2, R: 1, C: 1, TypeScript: 1, Go: 1 },
    note: 'ML stack: Python, notebooks, and numerically-oriented languages.',
  },
  {
    key: 'cloud',
    label: 'Cloud Engineer',
    languages: { Go: 3, Python: 3, Shell: 3, TypeScript: 2, Java: 1, HCL: 2, YAML: 2 },
    note: 'Infrastructure languages: Go / Python / Shell plus declarative config.',
  },
  {
    key: 'devops',
    label: 'DevOps Engineer',
    languages: { Shell: 3, Go: 3, Python: 2, YAML: 2, HCL: 2, TypeScript: 1, Dockerfile: 2 },
    note: 'Automation: Shell / Go / Python with config-as-code tooling.',
  },
];

export function computeCareer(e: CareerEvidence): CareerAnalysis {
  const observed = new Set<string>(e.languages);
  const roles: RoleReadiness[] = [];

  for (const spec of ROLE_SPECS) {
    const ideal = Object.keys(spec.languages).filter((l) => spec.languages[l] > 0);
    const maxWeight = Object.values(spec.languages).reduce((s, w) => s + w, 0);

    let gained = 0;
    const found: string[] = [];
    const missing: string[] = [];
    for (const lang of ideal) {
      const weight = spec.languages[lang];
      if (observed.has(lang)) {
        gained += weight;
        found.push(lang);
      } else if (weight >= 2) {
        missing.push(lang);
      }
    }
    const coverage = maxWeight ? gained / maxWeight : 0;

    // Soft behavioral fit drawn from measured sub-scores.
    const collabFit = e.subScores.collaboration / 100; // 0..1
    const diversityFit = e.subScores.diversity / 100;
    const consistencyFit = e.subScores.consistency / 100;

    let metricFit = 0.5 + 0.25 * consistencyFit + 0.25 * collabFit;
    if (spec.key === 'fullstack') metricFit += 0.15 * diversityFit;
    if (spec.key === 'ai') metricFit += 0.15 * diversityFit + 0.1 * (e.momentum / 100);
    if (spec.key === 'devops' || spec.key === 'cloud') metricFit += 0.1 * collabFit;

    const raw = coverage * 0.7 + clamp(metricFit, 0, 1) * 0.3;
    const score = round0(clamp(raw, 0, 1) * 100);

    const matchedBy = `Matched ${found.length} of ${ideal.length} typical ${spec.label.toLowerCase()} languages (${Math.round(coverage * 100)}% coverage) plus behavioral fit.`;
    const topGaps = missing.slice(0, 3);
    const gaps = topGaps.map((skill, i) => ({
      skill,
      note: `${skill} is common in ${spec.label.toLowerCase()} roles.`,
      critical: i < Math.min(2, Math.ceil(missing.length / 2)),
    }));
    const nextSteps = topGaps.length
      ? [
          `Build a small ${topGaps[0]} project to close the most important gap.`,
          ...topGaps.slice(1).map((g) => `Explore ${g} in a side project.`),
          'Publish a polished, documented example repository.',
        ]
      : [
          'Deepen the existing stack with one polished flagship repo.',
          'Add CI and tests to demonstrate production readiness.',
        ];

    roles.push({ roleKey: spec.key, roleLabel: spec.label, score, foundStrengths: found, gaps, nextSteps, matchedBy });
  }

  roles.sort((a, b) => b.score - a.score);
  const top = roles[0];
  return {
    roles,
    topRole: top.roleKey,
    topScore: top.score,
  };
}