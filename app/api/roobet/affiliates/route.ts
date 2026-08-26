import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Never cache — always pull live wager data from Roobet on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const ROOBET_API_KEY = process.env.ROOBET_API_KEY;

// Our Roobet affiliate account's userId (per Roobet's Affiliate Stats API spec —
// this identifies OUR affiliate account, not an individual customer).
const ROOBET_AFFILIATE_USER_ID = "51b44ea5-f07c-41c8-9daf-9a35718b459e";

// Per Roobet's official "Affiliate Stats API" OpenAPI spec:
//   Base URL: https://roobetconnect.com
//   GET /affiliate/v2/stats?userId=...&startDate=...&endDate=...
const ROOBET_ENDPOINT = "https://roobetconnect.com/affiliate/v2/stats";

export async function GET(request: NextRequest) {
  if (!ROOBET_API_KEY) {
    return NextResponse.json(
      { error: "Roobet API key is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const isoStart = startDate ? `${startDate}T00:00:00.000Z` : undefined;
  const isoEnd = endDate ? `${endDate}T23:59:59.999Z` : undefined;

  console.log("[v0] Roobet date range:", isoStart, "→", isoEnd);

  const upstream = new URL(ROOBET_ENDPOINT);
  upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
  if (isoStart) upstream.searchParams.set("startDate", isoStart);
  if (isoEnd) upstream.searchParams.set("endDate", isoEnd);

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ROOBET_API_KEY}`,
        Accept: "application/json",
      },
      // @ts-ignore — node-fetch agent type vs built-in fetch
      agent: proxyAgent,
    });

    const text = await response.text();
    console.log("[v0] Roobet status:", response.status);
    console.log("[v0] Roobet FULL response body:", text);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Roobet API returned a non-200 response",
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
        { error: "Roobet API returned invalid JSON", raw: text },
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
      { error: "Failed to reach Roobet API", detail: message },
      { status: 503 }
    );
  }
}
