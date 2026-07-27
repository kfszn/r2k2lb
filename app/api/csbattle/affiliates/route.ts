import { NextRequest, NextResponse } from "next/server";

// Never cache — always pull live wager data from CsBattle on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// NOTE: Unlike the AceBet / LuxDrop routes, CsBattle's public API is reached
// directly (no outbound proxy). Routing it through PROXY_URL causes the
// upstream connection to be reset (ECONNRESET).

// The public affiliate leaderboard UUID. Configurable via env, with the
// R2K2 leaderboard as the default.
const CSBATTLE_LEADERBOARD_ID =
  process.env.CSBATTLE_LEADERBOARD_ID ??
  "a450042c-7dde-4fc3-9656-dca50d671cd8";
// Optional — CsBattle's public leaderboard endpoint does not require auth,
// but we forward a key as x-api-key if one is configured.
const CSBATTLE_API_KEY = process.env.CSBATTLE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // CsBattle expects `from` / `to` as "YYYY-MM-DD HH:mm:ss".
  // startDate → start of day, endDate → end of day.
  const from = startDate ? `${startDate} 00:00:00` : undefined;
  const to = endDate ? `${endDate} 23:59:59` : undefined;

  console.log("[v0] CsBattle date range:", from, "→", to);

  // Build the query manually so spaces encode as %20 (matching CsBattle's
  // documented format) rather than the "+" that URLSearchParams would emit.
  const query: string[] = [];
  if (from) query.push(`from=${encodeURIComponent(from)}`);
  if (to) query.push(`to=${encodeURIComponent(to)}`);
  const upstreamUrl =
    `https://api.csbattle.com/leaderboards/affiliates/${CSBATTLE_LEADERBOARD_ID}` +
    (query.length ? `?${query.join("&")}` : "");

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(CSBATTLE_API_KEY ? { "x-api-key": CSBATTLE_API_KEY } : {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    console.log("[v0] CsBattle status:", response.status);
    console.log("[v0] CsBattle FULL response body:", text);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "CsBattle API returned a non-200 response",
          status: response.status,
          detail: text,
        },
        { status: response.status }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "CsBattle API returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return NextResponse.json(
      { error: "Failed to reach CsBattle API", detail: message },
      { status: 503 }
    );
  }
}
