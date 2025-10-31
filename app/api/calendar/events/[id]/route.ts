import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any
    const ev = await anyDb.calendarEvent?.findUnique({ where: { id: params.id }, select: { userId: true } })
    if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (ev.userId && userId && ev.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await anyDb.calendarEvent?.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete event' }, { status: 500 })
  }
}


