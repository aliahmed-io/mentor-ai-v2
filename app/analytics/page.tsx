import { auth } from '@/server/auth'
import { db } from '@/server/db'
import AnalyticsClient from './AnalyticsClient'

function formatDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function AnalyticsPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  // Prepare last 14 days buckets
  const days: Date[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Study time from ChatSession (createdAt..lastActiveAt)
  const sessions = await (async () => {
    try {
      const anyDb = db as any
      return (await anyDb.chatSession?.findMany({ where: userId ? { userId } : {}, select: { createdAt: true, lastActiveAt: true } })) ?? []
    } catch {
      return []
    }
  })()
  const studyTimeByDay = days.map((day) => {
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const minutes = sessions.reduce((acc, s) => {
      const durMs = Math.max(0, (s.lastActiveAt?.getTime?.() ?? s.createdAt.getTime()) - s.createdAt.getTime())
      const midpoint = new Date(s.createdAt)
      midpoint.setHours(0, 0, 0, 0)
      if (s.createdAt >= day && s.createdAt < next) return acc + Math.round(durMs / 60000)
      return acc
    }, 0)
    return { day: formatDay(day), minutes }
  })

  // Flashcards by day (use set createdAt and count)
  const sets = await (async () => {
    try {
      const anyDb = db as any
      return (await anyDb.flashcardSet?.findMany({ where: userId ? { userId } : {}, select: { createdAt: true, count: true } })) ?? []
    } catch {
      return []
    }
  })()
  const flashcardsByDay = days.map((day) => {
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const count = sets.reduce((acc, s) => (s.createdAt >= day && s.createdAt < next ? acc + s.count : acc), 0)
    return { day: formatDay(day), count }
  })

  // Quizzes by day (QuizSet createdAt)
  const quizSets = await (async () => {
    try {
      const anyDb = db as any
      return (await anyDb.quizSet?.findMany({ where: userId ? { userId } : {}, select: { createdAt: true } })) ?? []
    } catch {
      return []
    }
  })()
  const quizzesByDay = days.map((day) => {
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const count = quizSets.reduce((acc, q) => (q.createdAt >= day && q.createdAt < next ? acc + 1 : acc), 0)
    return { day: formatDay(day), count }
  })

  // Scores series
  const scores = await (async () => {
    try {
      const anyDb = db as any
      return (await anyDb.quizScore?.findMany({ where: userId ? { userId } : {}, orderBy: { createdAt: 'asc' }, select: { percentage: true, createdAt: true } })) ?? []
    } catch {
      return []
    }
  })()
  const nextEvent = await (async () => {
    try {
      const anyDb = db as any
      const now = new Date()
      return (await anyDb.calendarEvent?.findFirst({
        where: userId ? { userId, start: { gte: now } } : { start: { gte: now } },
        orderBy: { start: 'asc' },
        select: { id: true, title: true, start: true },
      })) ?? null
    } catch {
      return null
    }
  })()
  const scoresSeries = scores.map((s) => ({ date: s.createdAt.toLocaleDateString(), percentage: s.percentage }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Analytics</h1>
        <p className="text-sm text-muted-foreground">Study time, creation activity, and score trends</p>
      </div>
      {nextEvent && (
        <div className="rounded-md border bg-card p-4 text-sm">
          <div className="font-medium">Upcoming event</div>
          <div className="text-muted-foreground">{nextEvent.title} — {new Date(nextEvent.start).toLocaleString()}</div>
        </div>
      )}
      <AnalyticsClient
        studyTimeByDay={studyTimeByDay}
        flashcardsByDay={flashcardsByDay}
        quizzesByDay={quizzesByDay}
        scoresSeries={scoresSeries}
      />
    </div>
  )
}


