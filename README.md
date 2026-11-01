# Echoes 👻

**Every repository has a story. Some are waiting to be continued.**

Echoes is an AI-powered GitHub repository archaeology tool. Give it a public GitHub repository, and it investigates the project's history, structure, current state, and potential opportunities for revival.

The goal isn't just to summarize a repository. It's to help developers understand what happened to a project, what can be established from its available evidence, and where someone could pick up the work.

## What it does

Provide a public GitHub repository URL and Echoes generates an investigation report containing:

- **Repository overview** — Understand the project's purpose and background.
- **Architecture overview** — Explore the structure inferred from the README and file tree.
- **Development history** — Examine recent commits and project activity.
- **Current state** — Review available activity signals, open issues, and repository metadata.
- **Revival opportunities** — Discover potential areas for improvement or further development.
- **Evidence and unknowns** — Follow source links and distinguish facts from interpretations.

## How it works

Echoes follows an evidence-first investigation pipeline:

1. **Collect:** Fetch repository metadata, README, file tree, recent commits, and open issues through the GitHub API.
2. **Identify:** Assign evidence IDs to collected items before sending them for analysis.
3. **Analyze:** Send the collected context to Google's hosted Gemma model through the Gemini API.
4. **Validate:** Validate the model's structured response using Zod.
5. **Resolve:** Map cited evidence IDs back to trusted GitHub URLs. Unsupported or invented evidence IDs are discarded and counted.
6. **Report:** Present the findings with evidence links and clear distinctions between observed, inferred, and unknown information.

Repository content is treated as untrusted input. Instructions found inside READMEs, commit messages, or issues are not treated as instructions for the analysis.

## Built with

| Technology | Purpose |
|---|---|
| Next.js 16 | Application and API routes |
| React 19 | User interface |
| TypeScript | Application logic and type safety |
| Tailwind CSS 4 | Styling |
| Google GenAI SDK | Model integration |
| Gemma 4 | Repository analysis |
| GitHub REST API | Repository data and evidence |
| Zod | Structured output validation |
| Temporal | Optional durable investigation workflow |
| Sentry | Error monitoring and tracing |

## Getting started

### Prerequisites

- Node.js
- npm
- A Google Gemini API key
- GitHub token (optional, recommended for higher API rate limits)

### 1. Clone the repository

```bash
git clone https://github.com/72umesh/echoes.git
cd echoes
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and configure your values.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMMA_MODEL=gemma-4-26b-a4b-it
GITHUB_TOKEN=your_github_token

USE_TEMPORAL=false
SENTRY_DSN=your_sentry_dsn
```

- `GEMINI_API_KEY` — Required for model analysis.
- `GEMMA_MODEL` — Model used for generating the investigation.
- `GITHUB_TOKEN` — Optional GitHub token for API access.
- `USE_TEMPORAL` — Set to `true` to use the Temporal workflow for web investigations.
- `SENTRY_DSN` — Optional Sentry configuration.

Never commit `.env.local` or expose your API keys.

### 4. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a public GitHub repository URL, and start an investigation.

## CLI investigation

You can also run an investigation directly from the terminal:

```bash
npm run investigate -- https://github.com/owner/repository
```

Generated reports are saved locally as JSON files in the `reports/` directory.

## Optional: Temporal workflow

Echoes includes an optional Temporal-based investigation workflow.

Start a local Temporal development server:

```bash
temporal server start-dev
```

In another terminal, start the worker:

```bash
npm run worker
```

Set the following environment variable in `.env.local`:

```env
USE_TEMPORAL=true
```

Restart the Next.js development server to use Temporal for web investigations.

You can also run the Temporal investigation CLI:

```bash
npm run investigate:temporal -- https://github.com/owner/repository
```

The Temporal server and worker must be running when using this workflow.

## Current limitations

Echoes is an experimental project, and its reports should be treated as investigation aids rather than definitive assessments.

- Currently supports public GitHub repositories.
- Analysis uses repository metadata, README content, file tree, recent commits, and open issues. It does not inspect every source file.
- Architecture descriptions are inferred from the available repository structure and documentation.
- AI-generated interpretations may be incomplete or incorrect. Evidence links are provided to help verify findings.
- Low activity does not necessarily mean a repository is abandoned.
- Model analysis uses Google's hosted Gemini API with Gemma. It is not local, offline, or private.
- Generated reports are stored locally; there is no account system or cloud report storage.

## Why Echoes?

Open-source repositories hold more than code. They hold decisions, experiments, unfinished ideas, and traces of the people who built them.

Sometimes a project stops moving, but its story doesn't have to end there.

**Echoes helps you explore that story—and find what might come next.**