import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const set = await db.flashcardSet.findUnique({
    where: { id: params.id },
    include: { cards: true },
  })
  if (!set) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const flashcards = set.cards.map((c) => ({ id: c.id, front: c.front, back: c.back, tags: c.tags }))
  return NextResponse.json({ id: set.id, flashcards })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { topic } = await request.json()
    if (typeof topic !== 'string') return NextResponse.json({ error: 'Invalid topic' }, { status: 400 })
    const existing = await db.flashcardSet.findUnique({ where: { id: params.id }, select: { id: true, userId: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await db.flashcardSet.update({ where: { id: params.id }, data: { topic } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to rename' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await db.flashcardSet.findUnique({ where: { id: params.id }, select: { id: true, userId: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await db.flashcardCard.deleteMany({ where: { setId: params.id } })
    await db.flashcardSet.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 })
  }
}


