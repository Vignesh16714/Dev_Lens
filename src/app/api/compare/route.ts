import { NextRequest } from 'next/server';
import type { CompareResponse } from '@/lib/types';
import { resolveAnalysis } from '@/lib/github/provider';
import { toCompareProfile, computeCompare } from '@/lib/analytics/compare';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { inputA?: string; inputB?: string };
  try {
    body = (await req.json()) as { inputA?: string; inputB?: string };
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body.' } as CompareResponse, { status: 400 });
  }

  const a = (body.inputA ?? '').trim();
  const b = (body.inputB ?? '').trim();
  if (!a || !b) {
    return Response.json({ ok: false, error: 'Provide two GitHub profiles to compare.' } as CompareResponse, { status: 400 });
  }

  try {
    const [ra, rb] = await Promise.all([resolveAnalysis(a), resolveAnalysis(b)]);
    const pa = toCompareProfile(ra.canonical, ra.report);
    const pb = toCompareProfile(rb.canonical, rb.report);
    const result = computeCompare(pa, pb);
    return Response.json({
      ok: true,
      a: pa,
      b: pb,
      dimensions: result.dimensions,
      disclaimer: result.disclaimer,
    } as CompareResponse, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Comparison failed.';
    return Response.json({ ok: false, error: msg } as CompareResponse, { status: 404 });
  }
}