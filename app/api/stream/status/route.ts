export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await fetch('https://kick.com/api/v2/channels/r2ktwo', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // never cache — always fetch live
    });

    if (!res.ok) {
      return Response.json(
        { isLive: false, error: `Kick API returned ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    const isLive = data?.livestream !== null && data?.livestream !== undefined;

    return Response.json({ isLive });
  } catch (error) {
    console.error('[stream/status] Failed to fetch Kick channel:', error);
    return Response.json(
      { isLive: false, error: 'Failed to reach Kick API' },
      { status: 200 }
    );
  }
}
