import { validateXapiAccessToken } from "@/lib/xapi/auth";
import {
  persistXapiStatementsToSupabase,
  summarizeXapiStatement,
} from "@/lib/xapi/statements";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

function getBearerToken(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

async function persistStatementForLocalDevelopment(statement: unknown) {
  if (process.env.XAPI_WRITE_LOCAL_LOG !== "true") {
    return null;
  }

  const directory = path.join(process.cwd(), "data", "xapi-statements");
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${Date.now()}-${crypto.randomUUID()}.json`);
  await writeFile(filePath, JSON.stringify(statement, null, 2));

  return filePath;
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request.headers.get("authorization"));

    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token." },
        { status: 401 },
      );
    }

    const tokenResult = validateXapiAccessToken(token);

    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.reason },
        { status: 401 },
      );
    }

    const statement = await request.json();
    const localPath = await persistStatementForLocalDevelopment(statement);
    const storage = await persistXapiStatementsToSupabase(statement);
    const summary = Array.isArray(statement)
      ? statement.slice(0, 3).map(summarizeXapiStatement)
      : summarizeXapiStatement(statement);

    console.info("Received Coursera xAPI statement", {
      received: Array.isArray(statement) ? statement.length : 1,
      summary,
    });

    return NextResponse.json(
      {
        ok: true,
        received: Array.isArray(statement) ? statement.length : 1,
        summary,
        storage,
        localPath,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unexpected xAPI statement error.",
      },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "GTOPs xAPI statement endpoint",
    method: "POST",
    authorization: "Bearer token from /api/xapi/oauth/token",
  });
}
