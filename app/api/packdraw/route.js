import { NextResponse } from 'next/server';

// Simple in-memory cache for Packdraw requests
const cache = new Map();
const CACHE_DURATION = 300000; // 5 minutes - to avoid rate limiting

export async function GET(req) {
  try {
    const apiKey = "edadb58b-ea99-4c27-9b91-60b84c095ee9";
    const { searchParams } = new URL(req.url);
    const after = searchParams.get('after') || "2-16-2026"; // expects M-D-YYYY
    
    // Create cache key from parameters
    const cacheKey = `packdraw_${after}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new NextResponse(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        },
      });
    }
    
    const url = `https://packdraw.com/api/v1/affiliates/leaderboard?after=${encodeURIComponent(after)}&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    // Only cache successful responses
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      } catch (e) {
        // If JSON parsing fails, just continue without caching
      }
    }

    // If rate limited, return cached data if available
    if (response.status === 429) {
      if (cached) {
        return new NextResponse(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'STALE',
          },
        });
      }
      // No cached data available, return error
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Packdraw API error:', error);
    return NextResponse.json(
      { error: 'proxy_error', message: String(error) },
      { status: 500 }
    );
  }
}
