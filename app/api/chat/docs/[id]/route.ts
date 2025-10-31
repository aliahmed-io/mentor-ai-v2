import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const doc = await db.chatDocument.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: doc.id, title: doc.title, content: doc.content, createdAt: doc.createdAt })
}


