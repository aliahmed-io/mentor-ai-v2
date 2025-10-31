import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, title, content } = await request.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'missing content' }, { status: 400 })
    }
    const session = await auth()
    const doc = await db.chatDocument.create({
      data: {
        sessionId: sessionId ?? null,
        userId: session?.user?.id ?? null,
        title: title && typeof title === 'string' ? title : 'AI Note',
        content,
      },
    })
    return NextResponse.json({ id: doc.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save document' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit')) || 10))
  const docs = await db.chatDocument.findMany({
    where: session?.user?.id ? { userId: session.user.id } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, createdAt: true },
  })
  return NextResponse.json(docs)
}


