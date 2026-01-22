import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const apiKey = "edadb58b-ea99-4c27-9b91-60b84c095ee9";
    const { searchParams } = new URL(req.url);
    const after = searchParams.get('after') || "1-17-2026"; // expects M-D-YYYY
    
    const url = `https://packdraw.com/api/v1/affiliates/leaderboard?after=${encodeURIComponent(after)}&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
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
