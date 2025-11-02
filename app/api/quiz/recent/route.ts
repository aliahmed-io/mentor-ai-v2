import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit')) || 10))
  const anyDb = db as any
  try {
    const sets = await anyDb.quizSet.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, topic: true, difficulty: true, questionCount: true, createdAt: true, thumbnailUrl: true },
    })
    return NextResponse.json(sets)
  } catch {
    const sets = await anyDb.quizSet.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, topic: true, difficulty: true, questionCount: true, createdAt: true },
    })
    return NextResponse.json(sets)
  }
}


