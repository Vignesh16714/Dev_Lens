export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    ok: true,
    status: 'ok',
    service: 'DevLens',
    version: '1.0.0',
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    storage: 'filesystem',
    ai: Boolean(process.env.OPENAI_API_KEY) ? 'openai' : 'deterministic',
    now: new Date().toISOString(),
  });
}