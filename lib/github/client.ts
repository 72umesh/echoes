import { EchoesError, GitHubApiError } from "../errors";
import { GITHUB_LIMITS } from "./limits";
import type { RepoRef } from "./parse";

const API = "https://api.github.com";
const API_VERSION = "2022-11-28";

export type GitHubRepoMeta = {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  license: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  size: number;
  topics: string[];
  isEmpty: boolean;
};

export type GitHubCommit = {
  sha: string;
  htmlUrl: string;
  message: string;
  authorName: string | null;
  date: string | null;
};

export type GitHubIssue = {
  number: number;
  htmlUrl: string;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
};

export type GitHubFilePath = {
  path: string;
  type: string;
};

export type GitHubSnapshot = {
  meta: GitHubRepoMeta;
  readme: { found: boolean; markdown: string; htmlUrl: string | null };
  files: GitHubFilePath[];
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  warnings: string[];
};

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "echoes-repo-archaeology",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function parseRetryAfter(response: Response): number | undefined {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) return seconds;
  }
  const reset = response.headers.get("x-ratelimit-reset");
  if (reset) {
    const resetAt = Number(reset) * 1000;
    return Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  }
  return undefined;
}

function nextPageUrl(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/i);
    if (match) return match[1];
  }
  return undefined;
}

async function githubFetch(url: string): Promise<Response> {
  const response = await fetch(url, { headers: githubHeaders() });

  if (response.status === 403 || response.status === 429) {
    const retryAfterSeconds = parseRetryAfter(response);
    const remaining = response.headers.get("x-ratelimit-remaining");
    const body = await response.text();
    let detail = "";
    try {
      const json = JSON.parse(body) as { message?: string };
      detail = json.message ?? body.slice(0, 200);
    } catch {
      detail = body.slice(0, 200);
    }
    const waitHint =
      retryAfterSeconds !== undefined
        ? ` Retry after ${retryAfterSeconds} seconds.`
        : "";
    const unauthHint = process.env.GITHUB_TOKEN?.trim()
      ? ""
      : " No GITHUB_TOKEN is set, so GitHub's unauthenticated rate limit applies.";
    throw new GitHubApiError(
      response.status,
      `GitHub rate limit or forbidden response (${response.status}). Remaining: ${remaining ?? "unknown"}.${waitHint}${unauthHint} ${detail}`.trim(),
      retryAfterSeconds,
    );
  }

  return response;
}

async function githubJson<T>(url: string): Promise<{ data: T; response: Response }> {
  const response = await githubFetch(url);
  if (!response.ok) {
    const body = await response.text();
    let detail = body.slice(0, 300);
    try {
      const json = JSON.parse(body) as { message?: string };
      if (json.message) detail = json.message;
    } catch {
      // keep raw slice
    }
    throw new GitHubApiError(
      response.status,
      `GitHub API error ${response.status} for ${url}: ${detail}`,
    );
  }
  return { data: (await response.json()) as T, response };
}

async function getPaginated<T>(
  firstUrl: string,
  maxItems: number,
  maxPages: number,
): Promise<T[]> {
  const items: T[] = [];
  let url: string | undefined = firstUrl;
  let pages = 0;

  while (url && pages < maxPages && items.length < maxItems) {
    const { data, response } = await githubJson<T[]>(url);
    items.push(...data);
    url = nextPageUrl(response.headers.get("link"));
    pages += 1;
  }

  return items.slice(0, maxItems);
}

type RepoJson = {
  owner: { login: string };
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  license: { spdx_id: string | null } | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  archived: boolean;
  disabled: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  topics?: string[];
};

type ReadmeJson = {
  content?: string;
  encoding?: string;
  html_url?: string;
};

type TreeJson = {
  truncated?: boolean;
  tree?: { path?: string; type?: string }[];
};

type CommitJson = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string } | null;
  };
};

type IssueJson = {
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  state: string;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
};

export async function fetchGitHubSnapshot(ref: RepoRef): Promise<GitHubSnapshot> {
  const warnings: string[] = [];
  const repoUrl = `${API}/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;

  let metaJson: RepoJson;
  try {
    const { data } = await githubJson<RepoJson>(repoUrl);
    metaJson = data;
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      throw new EchoesError(
        "repo_not_found",
        `Repository ${ref.owner}/${ref.repo} was not found or is not public.`,
      );
    }
    throw error;
  }

  let isEmpty = metaJson.size === 0;
  const meta: GitHubRepoMeta = {
    owner: metaJson.owner.login,
    name: metaJson.name,
    fullName: metaJson.full_name,
    htmlUrl: metaJson.html_url,
    description: metaJson.description,
    defaultBranch: metaJson.default_branch,
    language: metaJson.language,
    license: metaJson.license?.spdx_id ?? null,
    stars: metaJson.stargazers_count,
    forks: metaJson.forks_count,
    openIssues: metaJson.open_issues_count,
    archived: metaJson.archived,
    disabled: metaJson.disabled,
    createdAt: metaJson.created_at,
    updatedAt: metaJson.updated_at,
    pushedAt: metaJson.pushed_at,
    size: metaJson.size,
    topics: metaJson.topics ?? [],
    isEmpty,
  };

  if (isEmpty) {
    warnings.push("Repository size is 0; it appears empty.");
  }

  let readmeMarkdown = "";
  let readmeFound = false;
  let readmeHtmlUrl: string | null = null;
  const readmeResponse = await githubFetch(`${repoUrl}/readme`);
  if (readmeResponse.status === 404) {
    warnings.push("No README file was found in this repository.");
  } else if (!readmeResponse.ok) {
    warnings.push(`README could not be fetched (HTTP ${readmeResponse.status}).`);
  } else {
    const readme = (await readmeResponse.json()) as ReadmeJson;
    readmeFound = true;
    readmeHtmlUrl = readme.html_url ?? `${meta.htmlUrl}/blob/${meta.defaultBranch}/README.md`;
    if (readme.encoding === "base64" && readme.content) {
      readmeMarkdown = Buffer.from(readme.content.replace(/\n/g, ""), "base64").toString(
        "utf8",
      );
    }
  }

  let files: GitHubFilePath[] = [];
  if (!isEmpty && meta.defaultBranch) {
    const treeUrl = `${repoUrl}/git/trees/${encodeURIComponent(meta.defaultBranch)}?recursive=1`;
    const treeResponse = await githubFetch(treeUrl);
    if (treeResponse.status === 409 || treeResponse.status === 404) {
      warnings.push("Git tree is unavailable; the repository may be empty.");
      isEmpty = true;
      meta.isEmpty = true;
    } else if (!treeResponse.ok) {
      const body = await treeResponse.text();
      throw new GitHubApiError(
        treeResponse.status,
        `Could not fetch the repository file tree (HTTP ${treeResponse.status}): ${body.slice(0, 200)}`,
      );
    } else {
      const tree = (await treeResponse.json()) as TreeJson;
      const blobs = (tree.tree ?? [])
        .filter((entry) => entry.type === "blob" && entry.path)
        .map((entry) => ({ path: entry.path as string, type: "blob" }))
        .sort(
          (a, b) =>
            a.path.split("/").length - b.path.split("/").length ||
            a.path.localeCompare(b.path),
        );
      files = blobs.slice(0, GITHUB_LIMITS.maxFilePaths);
      if (tree.truncated) {
        warnings.push("GitHub truncated the file tree; only a subset of paths is available.");
      }
      if (blobs.length > GITHUB_LIMITS.maxFilePaths) {
        warnings.push(
          `File tree capped at ${GITHUB_LIMITS.maxFilePaths} paths (of ${blobs.length} blobs returned).`,
        );
      }
      if (files.length === 0) {
        warnings.push("File tree contained no files.");
        isEmpty = true;
        meta.isEmpty = true;
      }
    }
  }

  if (isEmpty && files.length === 0 && !readmeFound) {
    throw new EchoesError(
      "empty_repo",
      `Repository ${meta.fullName} is empty (no files, no README). There is nothing to investigate.`,
    );
  }

  const commitsJson = await getPaginated<CommitJson>(
    `${repoUrl}/commits?per_page=${GITHUB_LIMITS.maxCommits}`,
    GITHUB_LIMITS.maxCommits,
    GITHUB_LIMITS.maxPagesPerCall,
  );
  const commits: GitHubCommit[] = commitsJson.map((commit) => ({
    sha: commit.sha,
    htmlUrl: commit.html_url,
    message: commit.commit.message,
    authorName: commit.commit.author?.name ?? null,
    date: commit.commit.author?.date ?? null,
  }));

  const issuesJson = await getPaginated<IssueJson>(
    `${repoUrl}/issues?state=open&per_page=${GITHUB_LIMITS.maxIssues}`,
    GITHUB_LIMITS.maxIssues,
    GITHUB_LIMITS.maxPagesPerCall,
  );
  const issues: GitHubIssue[] = issuesJson
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      htmlUrl: issue.html_url,
      title: issue.title,
      body: issue.body ?? "",
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    }));

  return {
    meta,
    readme: { found: readmeFound, markdown: readmeMarkdown, htmlUrl: readmeHtmlUrl },
    files,
    commits,
    issues,
    warnings,
  };
}
