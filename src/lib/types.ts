// ---------------------------------------------------------------------------
// DevLens shared domain types.
// These are the "normalized" shapes produced from GitHub data and consumed by
// the analytics + AI engines. Keeping the boundary explicit means we can switch
// data sources (live GitHub, mock, cache) without touching analytics/UI.
// ---------------------------------------------------------------------------

export type DataSource = 'github' | 'mock' | 'cache';

// --- GitHub normalization -------------------------------------------------

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string; // ISO date
  updatedAt: string | null;
  type: 'User' | 'Organization';
  hireable: boolean | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  fork: boolean;
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  openIssuesCount: number;
  size: number; // KB
  defaultBranch: string;
  archived: boolean;
  disabled: boolean;
  license: { key: string; name: string } | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
}

// A single analysis window of a repository (languages + time frame).
export interface RepoLanguagePoint {
  language: string;
  bytes: number;
  percent: number;
}

export interface GitHubLangStats {
  repoFullName: string;
  languages: RepoLanguagePoint[];
}

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: number; // 0..4 derived from count
}

export interface EventActivity {
  type: string;
  count: number;
}

export interface WeeklyActivity {
  weekStart: string; // ISO date
  count: number;
}
// --- DevLens analytics ----------------------------------------------------

export interface SubScores {
  activity: number;
  consistency: number;
  diversity: number;
  collaboration: number;
  growth: number;
}

export interface IntelligenceReport {
  user: GitHubUser;
  metrics: {
    totalCommits: number;
    totalRepos: number;
    forkedRepos: number;
    ownedRepos: number;
    totalStars: number;
    totalForks: number;
    totalIssuesOpened: number;
    totalPrs: number;
    totalReviews: number;
    totalLanguages: number;
    primaryLanguages: string[];
    accountAgeDays: number;
    activeDays: number;
    uniqueDays: number;
    contributionDaysCount: number;
    averageActiveRatio: number;
    languagesByShare: RepoLanguagePoint[];
    topRepoByStars: { name: string; stars: number } | null;
    recentActivityCount: number;
  };
  subScores: SubScores;
  intelligenceScore: number; // 0..100
  activity: ActivityAnalysis;
  projects: ProjectAnalysis;
  growth: GrowthAnalysis;
  ai: AiProfile;
}
export interface ActivityAnalysis {
  heatmap: ContributionDay[];
  weeklySeries: WeeklyActivity[];
  monthlySeries: { month: string; commits: number; events: number }[];
  eventBreakdown: EventActivity[];
  commitByHour: { hour: number; count: number }[];
  mostActiveDay: string | null;
  mostActiveTime: string | null;
  peakMonth: string | null;
  trendDirection: 'up' | 'down' | 'flat';
  githubReported: {
    events: number;
    contributedRepos: number;
    gistEvents: number;
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
  };
  devlensCalculated: {
    activeDays: number;
    averageActiveRatio: number;
    averageCommitsPerActiveDay: number;
    averageWorkingHoursSpan: string;
  };
}

export interface RepoHealth {
  score: number; // 0..100
  factors: {
    label: string;
    value: number; // 0..100
    weight: number;
    note: string;
  }[];
}

export interface ProjectItem {
  repo: GitHubRepo;
  languages: RepoLanguagePoint[];
  ageDays: number;
  starsPerDay: number;
  recentPush: boolean;
  maintenance: 'active' | 'steady' | 'stale' | 'archived';
  health: RepoHealth;
  activityLevel: 'high' | 'medium' | 'low';
}

export interface ProjectAnalysis {
  items: ProjectItem[];
  totalStars: number;
  totalForks: number;
  languageMix: RepoLanguagePoint[];
  avgHealth: number;
  avgMaintenance: number;
  archivedCount: number;
  forkedCount: number;
  staleCount: number;
}

export interface TechTrendPoint {
  language: string;
  interval: string; // e.g. 2024-Q1
  share: number; // 0..100 share of activity/lines
  tokens: number;
  delta: number; // share change vs previous interval
  direction: 'up' | 'down' | 'flat';
}

export interface GrowthAnalysis {
  techTrends: TechTrendPoint[];
  projectCreationTimeline: { month: string; count: number }[];
  activityTrend: { month: string; count: number }[];
  trajectory: {
    label: string;
    summary: string;
    momentum: number; // -100..100
  };
  languageCategories: {
    language: string;
    firstSeen: string;
    lastSeen: string;
    peakShare: number;
    trend: 'rising' | 'established' | 'declining' | 'new';
  }[];
}
export interface AiProfile {
  persona: string;
  summary: string;
  strengths: { title: string; detail: string; evidence: string }[];
  weaknesses: { title: string; detail: string; evidence: string }[];
  patterns: string[];
  trajectory: string;
  recommendations: {
    title: string;
    detail: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }[];
  provenance: { label: string; value: string }[];
}

// --- Career ---------------------------------------------------------------

export type RoleKey =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'ai'
  | 'cloud'
  | 'devops';

export interface RoleReadiness {
  roleKey: RoleKey;
  roleLabel: string;
  score: number; // 0..100
  foundStrengths: string[];
  gaps: { skill: string; note: string; critical: boolean }[];
  nextSteps: string[];
  matchedBy: string; // human-readable explanation of what drove the score
}

export interface CareerAnalysis {
  roles: RoleReadiness[];
  topRole: RoleKey;
  topScore: number;
}

// --- Compare --------------------------------------------------------------

export interface CompareDimension {
  key: string;
  label: string;
  a: number;
  b: number;
  note: string;
}

export interface CompareProfile {
  login: string;
  intelligenceScore: number;
  totalStars: number;
  totalRepos: number;
  totalCommits: number;
  activeDaysRatio: number;
  totalLanguages: number;
  collaborationIndex: number;
  contributionRecent: number;
}

// --- Analysis request / response ------------------------------------------

export interface AnalyzeRequest {
  input: string; // github username or profile URL
}

export interface AnalyzeResponse {
  ok: boolean;
  error?: string;
  report?: IntelligenceReport;
  career?: CareerAnalysis;
  source: DataSource;
  cached: boolean;
  fetchedAt: string;
  requestedUsername: string;
}

// Progress stages for the analysis screen.
export type ProgressStepKey =
  | 'profile'
  | 'repos'
  | 'activity'
  | 'tech'
  | 'intelligence'
  | 'ai';

export interface ProgressStep {
  key: ProgressStepKey;
  label: string;
}

export const PROGRESS_STEPS: ProgressStep[] = [
  { key: 'profile', label: 'Fetching profile' },
  { key: 'repos', label: 'Analyzing repositories' },
  { key: 'activity', label: 'Analyzing activity' },
  { key: 'tech', label: 'Detecting technologies' },
  { key: 'intelligence', label: 'Calculating developer intelligence' },
  { key: 'ai', label: 'Generating AI insights' },
];

export const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'frontend', label: 'Frontend Developer' },
  { key: 'backend', label: 'Backend Developer' },
  { key: 'fullstack', label: 'Full Stack Developer' },
  { key: 'ai', label: 'AI Engineer' },
  { key: 'cloud', label: 'Cloud Engineer' },
  { key: 'devops', label: 'DevOps Engineer' },
];

export interface CompareResult {
  a: CompareProfile;
  b: CompareProfile;
  dimensions: CompareDimension[];
  disclaimer: string;
}

export interface CompareRequest {
  inputA: string;
  inputB: string;
}

export interface CompareResponse {
  ok: boolean;
  error?: string;
  a?: CompareProfile;
  b?: CompareProfile;
  dimensions?: CompareDimension[];
  disclaimer?: string;
}