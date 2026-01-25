'use server';

export async function fetchGiveawayTotal() {
  try {
    // Get the giveaway total from environment variable
    const giveawayTotal = process.env.GIVEAWAY_TOTAL || '$0';
    console.log('[v0] Fetched giveaway total from env:', giveawayTotal);
    return giveawayTotal;
  } catch (error) {
    console.error('[v0] Error fetching giveaway total:', error);
    return '$0';
  }
}
