import type { AiProfile } from '../types';
import type { AiEvidence } from './insights';

/**
 * Optional enrichment provider. When OPENAI_API_KEY is configured, DevLens asks
 * a model to re-word the persona and summary from the *exact* structured
 * analytics (never inventing new facts). If the call fails or is not
 * configured, the deterministic, evidence-based profile is returned untouched.
 */
export async function maybeEnrichWithLlm(
  evidence: AiEvidence,
  base: AiProfile
): Promise<AiProfile> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return base;

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const system =
    'You are a factual analytics copywriter. Reword the persona and summary ' +
    'from the given numbers. Do NOT assert any fact that is not present in the ' +
    'input JSON. Return strict JSON: {"persona":"...","summary":"..."}.';

  const facts = {
    intelligenceScore: evidence.intelligenceScore,
    subScores: evidence.subScores,
    primaryLanguages: evidence.primaryLanguages,
    totalCommits: evidence.totalCommits,
    totalRepos: evidence.totalRepos,
    totalStars: evidence.totalStars,
    activeRatio: evidence.activeRatio,
    recentActivity: evidence.recentActivity,
    momentum: evidence.momentum,
    avgProjectHealth: evidence.projects.avgHealth,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Input facts: ${JSON.stringify(facts)}` },
        ],
      }),
    });
    if (!res.ok) return base;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return base;
    const parsed = JSON.parse(content) as { persona?: string; summary?: string };
    return {
      ...base,
      persona: parsed.persona?.trim() ? parsed.persona : base.persona,
      summary: parsed.summary?.trim() ? parsed.summary : base.summary,
    };
  } catch {
    return base;
  } finally {
    clearTimeout(timer);
  }
}