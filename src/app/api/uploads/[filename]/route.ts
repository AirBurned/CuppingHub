import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Security: prevent path traversal
  const safe = path.basename(filename)
  const filepath = path.join(UPLOADS_DIR, safe)

  try {
    const buffer = await readFile(filepath)
    const ext = safe.split('.').pop()?.toLowerCase() || 'jpg'
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
