import { CourseraApiError, getCourseraAccessToken } from "@/lib/coursera";
import { NextResponse } from "next/server";

export async function GET() {
  if ((process.env.COURSERA_AUTH_MODE ?? "basic") !== "oauth-client-credentials") {
    return NextResponse.json({
      ok: false,
      skipped: true,
      authMode: process.env.COURSERA_AUTH_MODE ?? "basic",
      message:
        "Token request skipped. Current Coursera auth mode is HTTP Basic API-key auth, not OAuth client-credentials. Use /api/coursera/report-probe after setting COURSERA_REPORT_PATH.",
    });
  }

  try {
    const token = await getCourseraAccessToken();

    return NextResponse.json({
      ok: true,
      token: {
        present: true,
        tokenType: token.token_type ?? null,
        expiresIn: token.expires_in ?? null,
        scope: token.scope ?? null,
      },
      message: "Coursera access token request succeeded. Token value was not exposed.",
    });
  } catch (error) {
    if (error instanceof CourseraApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.details,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { message: "Unexpected Coursera token check failure." },
      },
      { status: 500 },
    );
  }
}
