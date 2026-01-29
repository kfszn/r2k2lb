export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new Response('Missing URL parameter', { status: 400 })
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://acebet.com/',
      },
    })

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: 500 })
    }

    const contentType = response.headers.get('content-type')
    const buffer = await response.arrayBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[v0] Avatar proxy error:', error)
    return new Response('Failed to proxy image', { status: 500 })
  }
}
