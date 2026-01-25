'use server';

export async function fetchGiveawayTotal() {
  try {
    // Debug: Log all env vars that start with GIVEAWAY
    const allEnvKeys = Object.keys(process.env).filter(key => key.includes('GIVEAWAY'));
    console.log('[v0] Environment keys with GIVEAWAY:', allEnvKeys);
    
    // Get the giveaway total from environment variable (must use NEXT_PUBLIC_ prefix)
    const giveawayTotal = process.env.NEXT_PUBLIC_GIVEAWAY_TOTAL;
    console.log('[v0] NEXT_PUBLIC_GIVEAWAY_TOTAL value:', giveawayTotal);
    console.log('[v0] All NEXT_PUBLIC vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')).map(k => `${k}=${process.env[k]}`));
    
    const result = giveawayTotal || '$0';
    console.log('[v0] Returning giveaway total:', result);
    return result;
  } catch (error) {
    console.error('[v0] Error fetching giveaway total:', error);
    return '$0';
  }
}
