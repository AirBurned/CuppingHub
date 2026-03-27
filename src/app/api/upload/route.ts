import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `lot-${Date.now()}.${ext}`

  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(path.join(UPLOADS_DIR, filename), buffer)

  // Crop data is saved as separate query param by the frontend
  return NextResponse.json({ url: `/api/uploads/${filename}` })
}
