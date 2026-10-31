import { NextResponse } from "next/server";
import { EchoesError } from "@/lib/errors";
import { investigateRepository } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  let repoUrl = "";
  try {
    const body = (await request.json()) as { repoUrl?: unknown };
    repoUrl = typeof body.repoUrl === "string" ? body.repoUrl : "";
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Send JSON like {\"repoUrl\": \"https://github.com/owner/repo\"}." } },
      { status: 400 },
    );
  }

  try {
    let id: string;
    if (process.env.USE_TEMPORAL === "true") {
      const { runInvestigationViaTemporal } = await import("@/temporal/client");
      id = (await runInvestigationViaTemporal(repoUrl)).id;
    } else {
      id = (await investigateRepository(repoUrl)).report.id;
    }
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof EchoesError) {
      const status =
        error.code === "invalid_url" ? 400 : error.code === "repo_not_found" ? 404 : 502;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    console.error(error);
    return NextResponse.json(
      { error: { code: "internal", message: "Investigation failed. Check the server terminal." } },
      { status: 500 },
    );
  }
}