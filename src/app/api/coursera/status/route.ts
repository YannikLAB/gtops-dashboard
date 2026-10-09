import { NextResponse } from "next/server";

export async function GET() {
  const hasClientId = Boolean(process.env.COURSERA_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.COURSERA_CLIENT_SECRET);
  const orgId = process.env.COURSERA_ORG_ID;

  return NextResponse.json({
    configured: hasClientId && hasClientSecret && Boolean(orgId),
    coursera: {
      hasClientId,
      hasClientSecret,
      orgId: orgId
        ? `${orgId.slice(0, 4)}…${orgId.slice(Math.max(orgId.length - 4, 4))}`
        : null,
    },
    message:
      hasClientId && hasClientSecret && orgId
        ? "Coursera credentials are present server-side. No sync has run yet."
        : "Coursera credentials are incomplete. Add COURSERA_CLIENT_ID, COURSERA_CLIENT_SECRET, and COURSERA_ORG_ID to .env.local.",
  });
}
