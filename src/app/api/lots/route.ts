import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') || 'ACTIVE'
  const search = searchParams.get('search') || ''

  const lots = await prisma.lot.findMany({
    where: {
      status: status as 'ACTIVE' | 'ARCHIVED',
      ...(search ? { OR: [
        { name: { contains: search } },
        { country: { contains: search } },
        { roaster: { contains: search } },
      ] } : {}),
    },
    include: { evaluations: { select: { totalScore: true } }, _count: { select: { evaluations: true, recipes: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const result = lots.map((lot) => {
    const avgScore = lot.evaluations.length > 0
      ? lot.evaluations.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / lot.evaluations.length : null
    return {
      id: lot.id, name: lot.name, country: lot.country, roaster: lot.roaster,
      processing: lot.processing, customProcessing: lot.customProcessing, roastLevel: lot.roastLevel, descriptors: lot.descriptors,
      photoUrl: lot.photoUrl, status: lot.status, avgScore: avgScore ? Math.round(avgScore * 100) / 100 : null,
      evaluationsCount: lot._count.evaluations, recipesCount: lot._count.recipes, createdAt: lot.createdAt,
    }
  })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  const body = await request.json()
  const lot = await prisma.lot.create({
    data: {
      name: body.name, country: body.country, roaster: body.roaster,
      farm: body.farm || null, variety: body.variety || null,
      processing: body.processing, customProcessing: body.customProcessing || null,
      roastLevel: body.roastLevel,
      roastDate: body.roastDate ? new Date(body.roastDate) : null,
      altitude: body.altitude || null,
      descriptors: body.descriptors || null, photoUrl: body.photoUrl || null,
      status: body.status || 'ACTIVE',
    },
  })
  return NextResponse.json(lot, { status: 201 })
}
