export class EchoesError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EchoesError";
    this.code = code;
  }
}

export class GitHubApiError extends EchoesError {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(status === 403 || status === 429 ? "github_rate_limit" : "github_api", message);
    this.name = "GitHubApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
