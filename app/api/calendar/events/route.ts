import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/server/auth'
import { db } from '@/server/db'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const session = await auth()
    const userId = session?.user?.id ?? null

    const where: any = {}
    if (userId) where.userId = userId
    if (from || to) {
      where.start = {}
      if (from) where.start.gte = new Date(from)
      if (to) where.start.lte = new Date(to)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any
    const events = await anyDb.calendarEvent?.findMany({
      where,
      orderBy: { start: 'asc' },
      select: { id: true, title: true, description: true, start: true, end: true, allDay: true },
    })
    return NextResponse.json(events ?? [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    let userId = session?.user?.id ?? null
    const { title, description, start, end, allDay } = await request.json()
    if (!title || !start || !end) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any
    // Verify user exists to avoid FK violations; if not, create as anonymous
    if (userId) {
      try {
        const u = await anyDb.user?.findUnique({ where: { id: userId }, select: { id: true } })
        if (!u) userId = null
      } catch {
        userId = null
      }
    }
    const ev = await anyDb.calendarEvent?.create({
      data: {
        userId,
        title: String(title),
        description: description ? String(description) : null,
        start: new Date(start),
        end: new Date(end),
        allDay: Boolean(allDay),
      },
      select: { id: true },
    })
    return NextResponse.json({ id: ev?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create event' }, { status: 500 })
  }
}


