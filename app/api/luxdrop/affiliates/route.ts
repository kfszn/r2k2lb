import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Match the same module-level pattern used by the AceBet route
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const LUXDROP_API_KEY = process.env.LUXDROP_API_KEY;
const LUXDROP_AFFILIATE_CODES = process.env.LUXDROP_AFFILIATE_CODES ?? "R2K2";

export async function GET(request: NextRequest) {

  if (!LUXDROP_API_KEY) {
    return NextResponse.json(
      { error: "LuxDrop API key is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Convert plain YYYY-MM-DD dates to full ISO timestamps expected by the API
  // startDate → start of day UTC (T00:00:00.000Z)
  // endDate   → end of day UTC   (T23:59:59.999Z)
  const isoStart = startDate ? `${startDate}T00:00:00.000Z` : undefined;
  const isoEnd   = endDate   ? `${endDate}T23:59:59.999Z`   : undefined;

  console.log("[v0] LuxDrop date range:", isoStart, "→", isoEnd);

  // Build upstream URL with required + optional query params
  const upstream = new URL("https://api.luxdrop.com/external/affiliates");
  upstream.searchParams.set("codes", LUXDROP_AFFILIATE_CODES);
  if (isoStart) upstream.searchParams.set("startDate", isoStart);
  if (isoEnd)   upstream.searchParams.set("endDate",   isoEnd);



  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        "x-api-key": LUXDROP_API_KEY,
        "Accept": "application/json",
      },
      // @ts-ignore — node-fetch agent type vs built-in fetch
      agent: proxyAgent,
    });

    const text = await response.text();
    console.log("[v0] LuxDrop status:", response.status);
    console.log("[v0] LuxDrop body (first 600):", text.slice(0, 600));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "LuxDrop API returned a non-200 response",
          status: response.status,
          detail: text,
        },
        { status: response.status }
      );
    }

    // Parse JSON — guard against empty / malformed response body
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "LuxDrop API returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return NextResponse.json(
      { error: "Failed to reach LuxDrop API", detail: message },
      { status: 503 }
    );
  }
}
