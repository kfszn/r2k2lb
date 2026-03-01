import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface Participant {
  position: number;
  username: string;
  points: string;
  points_numeric: number;
  reward: string;
}

interface CacheEntry {
  data: Participant[];
  timestamp: number;
}

// In-memory cache: 5 minutes
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000;

function parsePointsNumeric(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)([KkMm]?)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toLowerCase();
  if (suffix === "k") return Math.round(num * 1000);
  if (suffix === "m") return Math.round(num * 1000000);
  return num;
}

async function tryFetchParse(url: string): Promise<Participant[] | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;
    const html = await res.text();
    return parseHtml(html);
  } catch {
    return null;
  }
}

function parseHtml(html: string): Participant[] {
  const participants: Participant[] = [];

  // Try to find JSON data embedded in the page (common in Next.js/React apps)
  const jsonMatches = html.matchAll(/"leaderboard":\s*(\[[\s\S]*?\])/g);
  for (const match of jsonMatches) {
    try {
      const arr = JSON.parse(match[1]);
      if (Array.isArray(arr) && arr.length > 0 && arr[0].username) {
        arr.forEach((entry: Record<string, unknown>, idx: number) => {
          participants.push({
            position: (entry.position as number) || idx + 1,
            username: String(entry.username || entry.name || ""),
            points: String(entry.points || entry.wager || "0"),
            points_numeric: parsePointsNumeric(
              String(entry.points || entry.wager || "0")
            ),
            reward: String(entry.reward || entry.prize || ""),
          });
        });
        if (participants.length > 0) return participants;
      }
    } catch {
      // continue
    }
  }

  // Try __NEXT_DATA__ embedded JSON
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const props = nextData?.props?.pageProps;
      if (props) {
        // Walk the props looking for arrays with username/points
        const found = findLeaderboardInObject(props);
        if (found && found.length > 0) return found;
      }
    } catch {
      // continue
    }
  }

  return participants;
}

function findLeaderboardInObject(obj: unknown): Participant[] | null {
  if (Array.isArray(obj)) {
    if (
      obj.length > 0 &&
      typeof obj[0] === "object" &&
      obj[0] !== null &&
      ("username" in obj[0] || "name" in obj[0])
    ) {
      return obj.map((entry: Record<string, unknown>, idx: number) => ({
        position: (entry.position as number) || idx + 1,
        username: String(entry.username || entry.name || ""),
        points: String(entry.points || entry.wager || entry.score || "0"),
        points_numeric: parsePointsNumeric(
          String(entry.points || entry.wager || entry.score || "0")
        ),
        reward: String(entry.reward || entry.prize || ""),
      }));
    }
  }
  if (obj && typeof obj === "object") {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      const result = findLeaderboardInObject(val);
      if (result && result.length > 0) return result;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leaderboardId = searchParams.get("id") || "230";
  const debug = searchParams.get("debug") === "1";
  const url = `https://acebet.com/affiliates/creator/r2k2?leaderboardId=${leaderboardId}`;

  // Check cache
  const cacheKey = leaderboardId;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      cached: true,
      updated_at: new Date(cache[cacheKey].timestamp).toISOString(),
      participants: cache[cacheKey].data,
    });
  }

  // --- Try plain fetch first (works if page is SSR) ---
  const fetchResult = await tryFetchParse(url);
  if (fetchResult && fetchResult.length > 0) {
    cache[cacheKey] = { data: fetchResult, timestamp: now };
    return NextResponse.json({
      success: true,
      cached: false,
      method: "fetch",
      updated_at: new Date(now).toISOString(),
      participants: fetchResult,
    });
  }

  // --- Debug mode: return raw HTML snippet so we can inspect structure ---
  if (debug) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const html = await res.text();
      return NextResponse.json({
        success: false,
        error: "Could not parse leaderboard - see raw_html_snippet for structure",
        raw_html_snippet: html.slice(0, 5000),
        html_length: html.length,
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `Fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
  }

  // --- Fallback: Puppeteer (only works on real Vercel, not v0 preview) ---
  let browser: import("puppeteer-core").Browser | null = null;

  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    let executablePath: string;
    try {
      executablePath = await chromium.executablePath();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Puppeteer unavailable in this environment. Try appending ?debug=1 to inspect the page structure.",
        },
        { status: 500 }
      );
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "font", "stylesheet", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    } catch {
      return NextResponse.json(
        { success: false, error: "Page load timeout" },
        { status: 500 }
      );
    }

    try {
      await page.waitForSelector("table", { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      // continue
    }

    const bodyText: string = await page.evaluate(
      () => document.body.innerText
    );
    const rawHtml: string = await page.evaluate(
      () => document.body.innerHTML
    );

    // Try HTML parse on rendered DOM
    const htmlParseResult = parseHtml(rawHtml);
    if (htmlParseResult.length > 0) {
      cache[cacheKey] = { data: htmlParseResult, timestamp: now };
      return NextResponse.json({
        success: true,
        cached: false,
        method: "puppeteer+html",
        updated_at: new Date(now).toISOString(),
        participants: htmlParseResult,
      });
    }

    // Parse leaderboard from body text
    const lines = bodyText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const participants: Participant[] = [];
    const positionRegex = /^(\d{1,3})$/;
    const pointsRegex = /^[\d,.]+[KkMm]?$/;

    let i = 0;
    while (i < lines.length) {
      const posMatch = lines[i].match(positionRegex);
      if (posMatch) {
        const position = parseInt(posMatch[1], 10);
        if (position >= 1 && position <= 200 && i + 5 < lines.length) {
          const level = lines[i + 1];
          const username = lines[i + 2];
          const points = lines[i + 3];
          const dollarSign = lines[i + 4];
          const reward = lines[i + 5];

          if (
            /^\d+$/.test(level) &&
            pointsRegex.test(points) &&
            dollarSign === "$"
          ) {
            participants.push({
              position,
              username,
              points,
              points_numeric: parsePointsNumeric(points),
              reward: `$${reward}`,
            });
            i += 6;
            continue;
          }
        }
      }
      i++;
    }

    if (participants.length === 0) {
      // Return debug info so we can fix the parser
      return NextResponse.json(
        {
          success: false,
          error: "No leaderboard data found",
          lines_sample: lines.slice(0, 50),
        },
        { status: 500 }
      );
    }

    cache[cacheKey] = { data: participants, timestamp: now };

    return NextResponse.json({
      success: true,
      cached: false,
      method: "puppeteer+text",
      updated_at: new Date(now).toISOString(),
      participants,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
