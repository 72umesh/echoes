/** Single source of GitHub fetch caps for the MVP. */
export const GITHUB_LIMITS = {
  maxCommits: 30,
  maxIssues: 20,
  maxFilePaths: 80,
  maxPagesPerCall: 2,
} as const;

export type GitHubLimits = typeof GITHUB_LIMITS;
