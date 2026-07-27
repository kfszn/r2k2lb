import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Never cache — always pull live wager data from CsBattle on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Match the same module-level proxy pattern used by the AceBet / LuxDrop routes
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

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

  const upstream = new URL(
    `https://api.csbattle.com/leaderboards/affiliates/${CSBATTLE_LEADERBOARD_ID}`
  );
  if (from) upstream.searchParams.set("from", from);
  if (to) upstream.searchParams.set("to", to);

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(CSBATTLE_API_KEY ? { "x-api-key": CSBATTLE_API_KEY } : {}),
      },
      // @ts-ignore — node-fetch agent type vs built-in fetch
      agent: proxyAgent,
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
