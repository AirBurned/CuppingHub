import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const recipe = await prisma.recipe.findUnique({ where: { id } })
  if (!recipe) return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })

  // Only author or admin can edit
  const isAdminUser = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  if (recipe.authorId !== user.userId && !isAdminUser) {
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.recipeType && isAdminUser) data.recipeType = body.recipeType
  const updated = await prisma.recipe.update({
    where: { id },
    data: {
      ...data,
      brewMethod: body.brewMethod ?? recipe.brewMethod,
      dose: body.dose ? parseFloat(body.dose) : null,
      yield: body.yield ? parseFloat(body.yield) : null,
      waterAmount: body.waterAmount ? parseFloat(body.waterAmount) : null,
      ratio: body.ratio || null,
      grind: body.grind || null,
      temperature: body.temperature ? parseFloat(body.temperature) : null,
      brewTime: body.brewTime || null,
      notes: body.notes || null,
    },
    include: { author: { select: { name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const recipe = await prisma.recipe.findUnique({ where: { id } })
  if (!recipe) return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })

  const isAdminUser = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  if (recipe.authorId !== user.userId && !isAdminUser) {
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 })
  }

  await prisma.recipe.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
