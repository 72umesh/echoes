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
      {
        error: {
          code: "bad_request",
          message:
            'Send JSON like {"repoUrl": "https://github.com/owner/repo"}.',
        },
      },
      { status: 400 },
    );
  }

  try {
    if (process.env.USE_TEMPORAL === "true") {
      const { runInvestigationViaTemporal } = await import("@/temporal/client");
      const { id } = await runInvestigationViaTemporal(repoUrl);
      return NextResponse.json({ id });
    }
    const { report } = await investigateRepository(repoUrl);
    return NextResponse.json({ id: report.id, report });
  } catch (error) {
    if (error instanceof EchoesError) {
      const status =
        error.code === "invalid_url"
          ? 400
          : error.code === "repo_not_found"
            ? 404
            : 502;
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status },
      );
    }
    console.error(error);

    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`.slice(0, 240)
        : "Unknown error";
    return NextResponse.json(
      {
        error: { code: "internal", message: `Investigation failed. ${detail}` },
      },
      { status: 500 },
    );
  }
}