import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? null
    const now = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any
    const ev = await anyDb.calendarEvent?.findFirst({
      where: userId ? { userId, start: { gte: now } } : { start: { gte: now } },
      orderBy: { start: 'asc' },
      select: { id: true, title: true, start: true, end: true, allDay: true, description: true },
    })
    if (!ev) return NextResponse.json(null)
    return NextResponse.json(ev)
  } catch (e: any) {
    return NextResponse.json(null)
  }
}


