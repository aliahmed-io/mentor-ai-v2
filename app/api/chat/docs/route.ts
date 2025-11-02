import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'
import { getImageFromUnsplash } from '@/app/_actions/image/unsplash'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, title, content } = await request.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'missing content' }, { status: 400 })
    }
    const session = await auth()
    // Try to make a cover image using Unsplash similar to presentations
    let thumb: string | undefined
    try {
      const queryBase = (title && typeof title === 'string' ? title : '') || content.slice(0, 120)
      const result = await getImageFromUnsplash(queryBase)
      if (result.success && result.imageUrl) thumb = result.imageUrl
    } catch {}

    const anyDb = db as any
    let doc
    try {
      doc = await anyDb.chatDocument.create({
        data: {
          sessionId: sessionId ?? null,
          userId: session?.user?.id ?? null,
          title: title && typeof title === 'string' ? title : 'AI Note',
          content,
          thumbnailUrl: thumb ?? null,
        },
      })
    } catch {
      doc = await anyDb.chatDocument.create({
        data: {
          sessionId: sessionId ?? null,
          userId: session?.user?.id ?? null,
          title: title && typeof title === 'string' ? title : 'AI Note',
          content,
        },
      })
    }
    return NextResponse.json({ id: doc.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save document' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit')) || 10))
  const anyDb = db as any
  try {
    const docs = await anyDb.chatDocument.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, title: true, createdAt: true, thumbnailUrl: true },
    })
    return NextResponse.json(docs)
  } catch {
    const docs = await anyDb.chatDocument.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, title: true, createdAt: true },
    })
    return NextResponse.json(docs)
  }
}


