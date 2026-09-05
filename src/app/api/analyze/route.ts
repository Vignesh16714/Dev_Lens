import { NextRequest } from 'next/server';
import type { AnalyzeRequest, AnalyzeResponse } from '@/lib/types';
import { analyzeGithub } from '@/lib/github/provider';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.', source: 'mock', cached: false, fetchedAt: new Date().toISOString(), requestedUsername: '' } satisfies AnalyzeResponse, 400);
  }

  const input = (body.input ?? '').trim();
  const result = await analyzeGithub(input);
  const status = result.ok ? 200 : 404;
  return jsonResponse(result, status);
}

function jsonResponse(data: AnalyzeResponse, status: number) {
  return Response.json(data, { status });
}