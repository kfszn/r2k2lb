import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Route all outbound requests through the static-IP proxy so LuxDrop's
// IP whitelist is satisfied — same mechanism used for AceBet API calls.
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const LUXDROP_API_KEY = process.env.LUXDROP_API_KEY;
const LUXDROP_AFFILIATE_CODES =
  process.env.LUXDROP_AFFILIATE_CODES ?? "R2K2";

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

  // Build upstream URL with required + optional query params
  const upstream = new URL("https://api.luxdrop.com/external/affiliates");
  upstream.searchParams.set("codes", LUXDROP_AFFILIATE_CODES);
  if (startDate) upstream.searchParams.set("startDate", startDate);
  if (endDate) upstream.searchParams.set("endDate", endDate);

  console.log("[v0] LuxDrop fetch URL:", upstream.toString());
  console.log("[v0] LuxDrop proxy agent active:", !!proxyAgent);
  console.log("[v0] LuxDrop API key present:", !!LUXDROP_API_KEY);

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

    console.log("[v0] LuxDrop response status:", response.status);
    const text = await response.text();
    console.log("[v0] LuxDrop response body (first 500):", text.slice(0, 500));

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
    console.log("[v0] LuxDrop fetch error:", message);
    return NextResponse.json(
      { error: "Failed to reach LuxDrop API", detail: message },
      { status: 503 }
    );
  }
}
