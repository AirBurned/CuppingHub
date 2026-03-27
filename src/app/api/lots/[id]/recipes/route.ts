import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const body = await request.json()
  const isAdminUser = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const recipeType = body.recipeType === 'OFFICIAL' && isAdminUser ? 'OFFICIAL' : 'UNOFFICIAL'
  const recipe = await prisma.recipe.create({
    data: { lotId: id, brewMethod: body.brewMethod, recipeType, authorId: user.userId, dose: body.dose ? parseFloat(body.dose) : null, yield: body.yield ? parseFloat(body.yield) : null, waterAmount: body.waterAmount ? parseFloat(body.waterAmount) : null, ratio: body.ratio || null, grind: body.grind || null, temperature: body.temperature ? parseFloat(body.temperature) : null, brewTime: body.brewTime || null, notes: body.notes || null },
    include: { author: { select: { name: true } } },
  })
  return NextResponse.json(recipe, { status: 201 })
}
