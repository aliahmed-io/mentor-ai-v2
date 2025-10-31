import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const s = await db.chatSession.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const messages = s.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  return NextResponse.json({ id: s.id, fileText: s.fileText ?? '', messages })
}


