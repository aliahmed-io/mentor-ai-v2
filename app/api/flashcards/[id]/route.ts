import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

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


