import { EchoesError } from "../errors";

export type RepoRef = {
  owner: string;
  repo: string;
};

export function parseGitHubUrl(input: string): RepoRef {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new EchoesError("invalid_url", "Provide a public GitHub repository URL.");
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new EchoesError(
      "invalid_url",
      "Could not parse that as a URL. Example: https://github.com/owner/repo",
    );
  }

  if (!/^(www\.)?github\.com$/i.test(url.hostname)) {
    throw new EchoesError(
      "invalid_url",
      "Only public github.com repository URLs are supported.",
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new EchoesError(
      "invalid_url",
      "URL must include owner and repository, e.g. https://github.com/owner/repo",
    );
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!owner || !repo) {
    throw new EchoesError("invalid_url", "Owner or repository name is missing.");
  }

  return { owner, repo };
}
