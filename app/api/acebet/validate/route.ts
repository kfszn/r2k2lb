import { NextRequest, NextResponse } from "next/server";
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;

const ACEBET_TOKEN = process.env.ACEBET_API_TOKEN;
interface AcebetUser {
  userId: number;
  name: string;
  avatar: string;
  badge: string | null;
  role: string;
  active: boolean;
  isPrivate: boolean;
  premiumUntil: string | null;
  wagered: number;
  deposited: number;
  earned: number;
  xp: number;
  firstSeen: string;
  lastSeen: string;
}
// Cache the user list for 5 minutes
let cachedUsers: AcebetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;
// Start date for current leaderboard cycle: Jun 29, 2026
const WAGER_WINDOW_START = "2026-06-29";
async function fetchAcebetUsers(): Promise<AcebetUser[]> {
  const now = Date.now();
  // Return cached data if still valid
  if (cachedUsers && now - cacheTimestamp < CACHE_DURATION) {
    return cachedUsers;
  }
  if (!ACEBET_TOKEN) {
    return [];
  }
  try {
    // Use the wager window start date to get cumulative wager data
    const url = `https://api.acebet.co/affiliates/detailed-summary/v2/${WAGER_WINDOW_START}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://acebet.co/",
        "Authorization": `Bearer ${ACEBET_TOKEN}`,
      },
      // @ts-ignore
      agent: proxyAgent,
      cache: "no-store",
    });
    if (!response.ok) {
      return cachedUsers || [];
    }
    const data = await response.json().catch(() => null);
    cachedUsers = Array.isArray(data) ? data : [];
    cacheTimestamp = now;
    return cachedUsers;
  } catch (error) {
    return cachedUsers || [];
  }
}
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }
    const users = await fetchAcebetUsers();
    const user = users.find(
      (u) => u.name && u.name.toLowerCase() === username.toLowerCase()
    );
    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          message: `User "${username}" not found under R2K2 affiliate`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        active: user.active,
        wagered: user.wagered,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
