import { NextRequest, NextResponse } from "next/server";

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

// Start date for counting wagers: 12/26/2025 EST (12am UTC)
const WAGER_WINDOW_START = "2025-12-26";

async function fetchAcebetUsers(): Promise<AcebetUser[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedUsers && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[v0] Returning cached Acebet users");
    return cachedUsers;
  }

  if (!ACEBET_TOKEN) {
    console.error("[v0] ACEBET_API_TOKEN not configured");
    return [];
  }

  try {
    // Use the wager window start date to get cumulative wager data
    const url = `https://api.acebet.com/affiliates/detailed-summary/v2/${WAGER_WINDOW_START}`;

    console.log("[v0] Fetching Acebet users from:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACEBET_TOKEN}`,
      },
      cache: "no-store",
    });

    console.log("[v0] Acebet API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[v0] Acebet API error:", response.status, errorText);
      return cachedUsers || [];
    }

    const data = await response.json().catch(() => null);
    console.log("[v0] Acebet API response - data type:", typeof data, "is array:", Array.isArray(data));

    cachedUsers = Array.isArray(data) ? data : [];
    cacheTimestamp = now;

    console.log("[v0] Cached", cachedUsers.length, "Acebet users");
    return cachedUsers;
  } catch (error) {
    console.error("[v0] Error fetching Acebet users:", error instanceof Error ? error.message : error);
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

    console.log("[v0] Validating Acebet username:", username);

    const users = await fetchAcebetUsers();
    console.log("[v0] Total users available:", users.length);

    const user = users.find(
      (u) => u.name && u.name.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      console.log("[v0] User not found:", username);
      return NextResponse.json(
        {
          valid: false,
          message: `User "${username}" not found under R2K2 affiliate`,
        },
        { status: 404 }
      );
    }

    console.log("[v0] User found:", user.name, "active:", user.active);

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
    console.error("[v0] Error in /api/acebet/validate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
