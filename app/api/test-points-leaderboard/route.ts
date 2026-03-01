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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leaderboardId = searchParams.get("id") || "230";
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

  let browser: import("puppeteer-core").Browser | null = null;

  try {
    // Dynamic imports to avoid build issues
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    let executablePath: string;
    try {
      executablePath = await chromium.executablePath();
    } catch {
      return NextResponse.json(
        { success: false, error: "Browser launch failed" },
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

    // Block unnecessary resources
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

    // Wait for table element
    try {
      await page.waitForSelector("table", { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      // Table might not appear — continue and try parsing anyway
    }

    const bodyText: string = await page.evaluate(() => document.body.innerText);

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
          // level, username, points, "$", reward
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
      return NextResponse.json(
        { success: false, error: "No leaderboard data found" },
        { status: 500 }
      );
    }

    // Store in cache
    cache[cacheKey] = { data: participants, timestamp: now };

    return NextResponse.json({
      success: true,
      cached: false,
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
