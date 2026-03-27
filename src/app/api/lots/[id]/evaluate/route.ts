import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// All numeric score fields
const numericKeys = [
  'aromaGround', 'aromaBrewed', 'flavor',
  'aftertasteDuration', 'aftertastePleasantness',
  'acidity', 'body', 'sweetness', 'cleanCup', 'overall',
]

// Keys that contribute to totalScore (aftertaste = average of duration + pleasantness)
const scoreKeys = [
  'aromaGround', 'aromaBrewed', 'flavor',
  'acidity', 'body', 'sweetness', 'cleanCup', 'overall',
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const evaluation = await prisma.evaluation.findUnique({ where: { userId_lotId: { userId: user.userId, lotId: id } } })
  return NextResponse.json(evaluation)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const targetUserId = body.userId || user.userId

  // Admins can delete anyone's evaluation; regular users can only delete their own
  if (targetUserId !== user.userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  await prisma.evaluation.deleteMany({ where: { lotId: id, userId: targetUserId } })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const body = await request.json()

  const data: Record<string, unknown> = {}
  for (const key of numericKeys) {
    if (body[key] !== undefined && body[key] !== null) data[key] = Number(body[key])
  }

  // Compute aftertaste as average of duration + pleasantness
  const dur = data.aftertasteDuration as number | undefined
  const pleas = data.aftertastePleasantness as number | undefined
  if (dur !== undefined && pleas !== undefined) {
    data.aftertaste = Math.round(((dur + pleas) / 2) * 100) / 100
  } else if (dur !== undefined) {
    data.aftertaste = dur
  } else if (pleas !== undefined) {
    data.aftertaste = pleas
  }

  // Comments for aroma stages
  if (body.aromaGroundComment !== undefined) data.aromaGroundComment = body.aromaGroundComment || null
  if (body.aromaBrewedComment !== undefined) data.aromaBrewedComment = body.aromaBrewedComment || null
  // Defects
  if (body.defectScore !== undefined) data.defectScore = body.defectScore !== null ? Number(body.defectScore) : null
  if (body.defectComment !== undefined) data.defectComment = body.defectComment || null
  // Descriptors and general comment
  if (body.descriptors !== undefined) data.descriptors = body.descriptors || null
  if (body.comment !== undefined) data.comment = body.comment || null

  // Calculate totalScore: scoreKeys + aftertaste (computed)
  const allScores: number[] = []
  for (const k of scoreKeys) {
    const v = data[k] as number | undefined
    if (v !== undefined && v !== null) allScores.push(v)
  }
  if (data.aftertaste !== undefined) allScores.push(data.aftertaste as number)
  if (allScores.length > 0) {
    data.totalScore = Math.round((allScores.reduce((s, v) => s + v, 0) / allScores.length) * 100) / 100
  }

  // Backward compat
  if (data.aromaGround !== undefined) data.aroma = data.aromaGround

  const evaluation = await prisma.evaluation.upsert({
    where: { userId_lotId: { userId: user.userId, lotId: id } },
    update: data,
    create: { userId: user.userId, lotId: id, ...data },
  })
  return NextResponse.json(evaluation)
}
