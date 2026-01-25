'use server';

export async function fetchGiveawayTotal() {
  try {
    // Get the giveaway total from environment variable (must use NEXT_PUBLIC_ prefix)
    const giveawayTotal = process.env.NEXT_PUBLIC_GIVEAWAY_TOTAL || '$0';
    console.log('[v0] Fetched giveaway total from env:', giveawayTotal);
    return giveawayTotal;
  } catch (error) {
    console.error('[v0] Error fetching giveaway total:', error);
    return '$0';
  }
}
