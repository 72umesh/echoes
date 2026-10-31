import { config } from "dotenv";
import { EchoesError } from "../lib/errors";
import { investigateRepository } from "../lib/pipeline";

config({ path: ".env.local" });
config();

async function main(): Promise<void> {
  const repoUrl = process.argv.slice(2).join(" ").trim();
  if (!repoUrl || repoUrl === "--help" || repoUrl === "-h") {
    console.error("Usage: npx tsx scripts/investigate.ts <github-repo-url>");
    process.exit(repoUrl ? 0 : 1);
  }

  const { report, path } = await investigateRepository(repoUrl);
  console.log(`Wrote ${path}`);
  console.log(`id=${report.id} droppedEvidenceCount=${report.droppedEvidenceCount}`);
}

main().catch((error: unknown) => {
  if (error instanceof EchoesError) {
    console.error(`${error.code}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Investigation failed.");
  }
  process.exit(1);
});
