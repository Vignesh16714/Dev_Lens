import type { AnalyzeResponse, CareerAnalysis, IntelligenceReport } from '../types';
import { extractUsername, createGithubClient, GithubApiError } from './client';
import { buildMockDataset } from './mock';
import { combineDataset, type Dataset } from '../normalize';
import { buildIntelligenceReport, buildCareer } from '../analytics';
import { maybeEnrichWithLlm } from '../ai';
import { getStore, cacheTtlMs } from '../db';

/** Result of a full analysis, before any AI-watermarking. */
export interface ResolvedAnalysis {
  report: IntelligenceReport;
  career: CareerAnalysis;
  source: 'github' | 'mock' | 'cache';
  cached: boolean;
  fetchedAt: string;
  canonical: string;
}

const LIVE_MAX_REPOS = 100;
const LIVE_MAX_LANGUAGES = 10; // Reduced from 15 — top 10 repos is plenty for language analysis
const LIVE_MAX_EVENTS = 200;   // Reduced from 300 — 200 events is enough for activity patterns
const ANALYSIS_TIMEOUT_MS = 45_000; // Hard timeout for the entire analysis pipeline

/**
 * Run a promise with a timeout. Rejects if the timeout is exceeded.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function platformlessFallback(e: GithubApiError): boolean {
  // Without a token we treat non-404 failures (network/rate-limit) as a cue to
  // fall back to demo data. 404 is a genuine "not found".
  return !process.env.GITHUB_TOKEN && e.kind !== 'not-found';
}

async function fetchLiveDataset(username: string): Promise<Dataset> {
  const client = createGithubClient();
  const { user } = await client.getUser(username);
  const reposRaw = await client.getRepos(username, LIVE_MAX_REPOS);

  // Minimize API calls: only fetch language breakdowns for the most relevant
  // repositories (skip forks, rank by stars + size), capped.
  const ranked = reposRaw
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count + b.size - (a.stargazers_count + a.size))
    .slice(0, LIVE_MAX_LANGUAGES);

  const languages: Record<string, Record<string, number>> = {};
  await Promise.all(
    ranked.map(async (r) => {
      try {
        languages[r.full_name] = await client.getLanguages(r.full_name);
      } catch {
        languages[r.full_name] = {};
      }
    })
  );

  const events = await client.getEvents(username, LIVE_MAX_EVENTS);

  return combineDataset({ userRaw: user, reposRaw, languages, events });
}

/** Core analysis pipeline: resolve a (possibly cached) analysis for a username. */
export async function resolveAnalysis(username: string): Promise<ResolvedAnalysis> {
  const store = getStore();
  const cached = await store.get(username);
  const ttl = cacheTtlMs();

  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < ttl) {
    const parsed = JSON.parse(cached.payload) as { report: IntelligenceReport; career: CareerAnalysis };
    return {
      report: parsed.report,
      career: parsed.career,
      source: 'cache',
      cached: true,
      fetchedAt: cached.fetchedAt,
      canonical: cached.canonicalUsername,
    };
  }

  let dataset: Dataset;
  let source: 'github' | 'mock' = 'github';
  try {
    // Hard timeout for the entire live-fetch pipeline
    dataset = await withTimeout(
      fetchLiveDataset(username),
      ANALYSIS_TIMEOUT_MS,
      'GitHub analysis'
    );
  } catch (e) {
    if (e instanceof GithubApiError && !platformlessFallback(e)) {
      throw new AnalysisError(
        e.kind === 'not-found'
          ? `GitHub user “${username}” was not found.`
          : e.kind === 'rate-limited'
            ? 'GitHub API rate limit reached. Add a GITHUB_TOKEN or retry later.'
            : e.kind === 'auth'
              ? 'GitHub token is invalid. Check GITHUB_TOKEN.'
              : 'Unable to reach the GitHub API right now.',
        e.kind
      );
    }
    // Fall back to deterministic demo data so the product always works.
    dataset = buildMockDataset(username);
    source = 'mock';
  }

  let report = buildIntelligenceReport(dataset);
  const career = buildCareer(report);

  // Optional LLM polish (never invents facts; falls back silently).
  report = {
    ...report,
    ai: await maybeEnrichWithLlm(
      {
        intelligenceScore: report.intelligenceScore,
        subScores: report.subScores,
        primaryLanguages: report.metrics.primaryLanguages,
        totalCommits: report.metrics.totalCommits,
        totalRepos: report.metrics.totalRepos,
        totalStars: report.metrics.totalStars,
        activeRatio: report.metrics.averageActiveRatio,
        recentActivity: report.metrics.recentActivityCount,
        prs: report.metrics.totalPrs,
        reviews: report.metrics.totalReviews,
        issues: report.metrics.totalIssuesOpened,
        momentum: report.growth.trajectory.momentum,
        trendDirection: report.activity.trendDirection,
        projects: report.projects,
        growth: report.growth,
        accountAgeDays: report.metrics.accountAgeDays,
      },
      report.ai
    ),
  };

  const fetchedAt = new Date().toISOString();
  await store.set({
    username,
    canonicalUsername: dataset.user.login,
    payload: JSON.stringify({ report, career }),
    fetchedAt,
    etag: null,
  });

  return {
    report,
    career,
    source,
    cached: false,
    fetchedAt,
    canonical: dataset.user.login,
  };
}

export class AnalysisError extends Error {
  constructor(message: string, readonly kind: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export async function analyzeGithub(input: string): Promise<AnalyzeResponse> {
  const username = extractUsername(input);
  if (!username) {
    return { ok: false, error: 'Enter a valid GitHub username or profile URL.', source: 'mock', cached: false, fetchedAt: new Date().toISOString(), requestedUsername: '' };
  }
  try {
    const res = await resolveAnalysis(username);
    return {
      ok: true,
      report: res.report,
      career: res.career,
      source: res.source,
      cached: res.cached,
      fetchedAt: res.fetchedAt,
      requestedUsername: username,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analysis failed.';
    return { ok: false, error: msg, source: 'mock', cached: false, fetchedAt: new Date().toISOString(), requestedUsername: username };
  }
}

export { extractUsername };