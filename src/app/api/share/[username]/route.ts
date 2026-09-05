import { NextRequest } from 'next/server';
import type { AnalyzeResponse } from '@/lib/types';
import { resolveAnalysis } from '@/lib/github/provider';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  ctx: { params: { username: string } }
) {
  const username = ctx.params.username;
  if (!username) {
    return Response.json({ ok: false, error: 'Missing username.', source: 'mock', cached: false, fetchedAt: new Date().toISOString(), requestedUsername: '' } satisfies AnalyzeResponse, { status: 400 });
  }
  try {
    const res = await resolveAnalysis(username);
    return Response.json({
      ok: true,
      report: res.report,
      career: res.career,
      source: res.source,
      cached: res.cached,
      fetchedAt: res.fetchedAt,
      requestedUsername: username,
    } satisfies AnalyzeResponse, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analysis not found.';
    return Response.json({ ok: false, error: msg, source: 'mock', cached: false, fetchedAt: new Date().toISOString(), requestedUsername: username } satisfies AnalyzeResponse, { status: 404 });
  }
}