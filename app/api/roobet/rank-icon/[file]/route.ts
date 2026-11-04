import { NextResponse } from 'next/server'

const ICON_FILE = /^[a-z]+\d*\.png$/
const SOURCES = [
  (file: string) => `https://roobet.com/immutable/rewards/levelcons/${file}`,
  (file: string) => `https://roobet.com/cdn-cgi/image/metadata=none,format=auto/https://roobet.com/immutable/rewards/levelcons/${file}`,
]

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file: rawFile } = await params
  // Roobet reports the unranked icon as "image0.png", which 404s; the real asset is "level0.png".
  const file = rawFile === 'image0.png' ? 'level0.png' : rawFile
  if (!ICON_FILE.test(file)) {
    return NextResponse.json({ error: 'Invalid icon' }, { status: 400 })
  }

  for (const source of SOURCES) {
    try {
      const res = await fetch(source(file), {
        headers: { Accept: 'image/png,image/*' },
        next: { revalidate: 60 * 60 * 24 * 7 },
        signal: AbortSignal.timeout(8000),
      })
      const type = res.headers.get('content-type') ?? ''
      if (!res.ok || !type.startsWith('image/')) continue
      return new NextResponse(await res.arrayBuffer(), {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000',
        },
      })
    } catch {
      continue
    }
  }

  return NextResponse.json({ error: 'Icon unavailable' }, { status: 502 })
}
