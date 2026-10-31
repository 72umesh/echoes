import type { GitHubSnapshot } from "./github/client";

export type EvidenceKind = "readme" | "file" | "commit" | "issue";

export type EvidenceRecord = {
  id: string;
  kind: EvidenceKind;
  label: string;
  url: string;
};

export type EvidenceMap = Map<string, EvidenceRecord>;

const FILE_PATH_SAFE = /^[A-Za-z0-9._\-/]+$/;

function fileBlobUrl(htmlUrl: string, branch: string, filePath: string): string {
  const encoded = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${htmlUrl}/blob/${encodeURIComponent(branch)}/${encoded}`;
}

export function buildEvidenceMap(snapshot: GitHubSnapshot): EvidenceMap {
  const map: EvidenceMap = new Map();

  if (snapshot.readme.found && snapshot.readme.htmlUrl) {
    const record: EvidenceRecord = {
      id: "readme-1",
      kind: "readme",
      label: "README",
      url: snapshot.readme.htmlUrl,
    };
    map.set(record.id, record);
  }

  snapshot.files.forEach((file, index) => {
    if (!FILE_PATH_SAFE.test(file.path) || file.path.includes("..")) {
      return;
    }
    const record: EvidenceRecord = {
      id: `file-${index + 1}`,
      kind: "file",
      label: file.path,
      url: fileBlobUrl(snapshot.meta.htmlUrl, snapshot.meta.defaultBranch, file.path),
    };
    map.set(record.id, record);
  });

  snapshot.commits.forEach((commit, index) => {
    const firstLine = commit.message.split("\n")[0]?.slice(0, 120);
    const record: EvidenceRecord = {
      id: `commit-${index + 1}`,
      kind: "commit",
      label: firstLine || commit.sha.slice(0, 7),
      url: commit.htmlUrl,
    };
    map.set(record.id, record);
  });

  snapshot.issues.forEach((issue, index) => {
    const record: EvidenceRecord = {
      id: `issue-${index + 1}`,
      kind: "issue",
      label: `#${issue.number} ${issue.title}`.slice(0, 160),
      url: issue.htmlUrl,
    };
    map.set(record.id, record);
  });

  return map;
}

export function evidenceList(map: EvidenceMap): EvidenceRecord[] {
  return [...map.values()];
}
