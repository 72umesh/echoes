import { config } from "dotenv";
import { EchoesError } from "../lib/errors";
import { runInvestigationViaTemporal } from "../temporal/client";

config({ path: ".env.local" });
config();

async function main(): Promise<void> {
  const repoUrl = process.argv.slice(2).join(" ").trim();
  if (!repoUrl) {
    console.error("Usage: npm run investigate:temporal -- <github-repo-url>");
    process.exit(1);
  }
  const { id } = await runInvestigationViaTemporal(repoUrl);
  console.log(`Report id: ${id}`);
  console.log(`Open: http://localhost:3000/report/${id}`);
}

main().catch((error: unknown) => {
  if (error instanceof EchoesError) console.error(`${error.code}: ${error.message}`);
  else console.error(error instanceof Error ? error.message : "Investigation failed.");
  process.exit(1);
});