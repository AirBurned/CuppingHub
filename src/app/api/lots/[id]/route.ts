import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  const lot = await prisma.lot.findUnique({
    where: { id },
    include: {
      recipes: { include: { author: { select: { name: true } } }, orderBy: [{ recipeType: 'asc' }, { createdAt: 'desc' }] },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      evaluations: { select: { totalScore: true, userId: true } },
    },
  })
  if (!lot) return NextResponse.json({ error: 'Лот не найден' }, { status: 404 })
  const myEvaluation = user ? lot.evaluations.find((e) => e.userId === user.userId) : null
  const scores = lot.evaluations.filter((e) => e.totalScore !== null)
  const avgScore = scores.length > 0 ? scores.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / scores.length : null
  // Add authorId to recipes for edit permission check
  const recipesWithAuthorId = lot.recipes.map((r) => ({ ...r, authorId: r.authorId }))
  return NextResponse.json({
    ...lot,
    recipes: recipesWithAuthorId,
    comments: lot.comments.map((c) => ({ id: c.id, text: c.text, createdAt: c.createdAt, userId: c.userId, user: c.user })),
    evaluations: undefined,
    avgScore: avgScore ? Math.round(avgScore * 100) / 100 : null,
    evaluationsCount: lot.evaluations.length,
    hasEvaluated: !!myEvaluation,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }
  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.country !== undefined) data.country = body.country
  if (body.roaster !== undefined) data.roaster = body.roaster
  if (body.farm !== undefined) data.farm = body.farm || null
  if (body.variety !== undefined) data.variety = body.variety || null
  if (body.processing !== undefined) data.processing = body.processing
  if (body.customProcessing !== undefined) data.customProcessing = body.customProcessing || null
  if (body.roastLevel !== undefined) data.roastLevel = body.roastLevel
  if (body.altitude !== undefined) data.altitude = body.altitude || null
  if (body.roastDate !== undefined) data.roastDate = body.roastDate ? new Date(body.roastDate) : null
  if (body.descriptors !== undefined) data.descriptors = body.descriptors || null
  if (body.status !== undefined) data.status = body.status
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl || null

  const lot = await prisma.lot.update({ where: { id }, data })
  return NextResponse.json(lot)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  await prisma.cuppingSessionLot.deleteMany({ where: { lotId: id } })
  await prisma.comment.deleteMany({ where: { lotId: id } })
  await prisma.evaluation.deleteMany({ where: { lotId: id } })
  await prisma.recipe.deleteMany({ where: { lotId: id } })
  await prisma.lot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
