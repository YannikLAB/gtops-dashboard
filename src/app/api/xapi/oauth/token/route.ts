import { createXapiAccessToken, validateXapiClient } from "@/lib/xapi/auth";
import { NextResponse } from "next/server";

function unauthorized(message = "Invalid xAPI client credentials.") {
  return NextResponse.json(
    {
      error: "invalid_client",
      error_description: message,
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="GTOPs xAPI"',
      },
    },
  );
}

function getBasicCredentials(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(authorization.slice("Basic ".length), "base64")
    .toString("utf8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  return {
    clientId: decoded.slice(0, separatorIndex),
    clientSecret: decoded.slice(separatorIndex + 1),
  };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const basicCredentials = getBasicCredentials(
      request.headers.get("authorization"),
    );

    let grantType: string | null = null;
    let clientId = basicCredentials?.clientId ?? null;
    let clientSecret = basicCredentials?.clientSecret ?? null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      grantType = form.get("grant_type")?.toString() ?? null;
      clientId = clientId ?? form.get("client_id")?.toString() ?? null;
      clientSecret = clientSecret ?? form.get("client_secret")?.toString() ?? null;
    } else {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      grantType = typeof body.grant_type === "string" ? body.grant_type : null;
      clientId = clientId ?? (typeof body.client_id === "string" ? body.client_id : null);
      clientSecret =
        clientSecret ??
        (typeof body.client_secret === "string" ? body.client_secret : null);
    }

    if (grantType !== "client_credentials") {
      return NextResponse.json(
        {
          error: "unsupported_grant_type",
          error_description: "Use grant_type=client_credentials.",
        },
        { status: 400 },
      );
    }

    if (!clientId || !clientSecret || !validateXapiClient(clientId, clientSecret)) {
      return unauthorized();
    }

    const token = createXapiAccessToken();

    return NextResponse.json({
      access_token: token.accessToken,
      token_type: "Bearer",
      expires_in: token.expiresIn,
      scope: "xapi:write",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          error instanceof Error ? error.message : "Unexpected xAPI token error.",
      },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "GTOPs xAPI OAuth token endpoint",
    method: "POST",
    grantType: "client_credentials",
    requiredScope: "xapi:write",
  });
}
