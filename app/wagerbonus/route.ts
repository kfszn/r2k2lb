import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const html = await readFile(join(process.cwd(), 'public', 'wagerbonus.html'), 'utf-8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
