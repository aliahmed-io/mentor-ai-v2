import { auth } from '@/server/auth'
import { db } from '@/server/db'
import AnalyticsClient from './AnalyticsClient'

function formatDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function AnalyticsPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  // Determine earliest activity date across entities (cap at 180 days back)
  const earliestDates: Date[] = []
  try {
    const anyDb = db as any
    const a = await anyDb.chatSession?.findFirst({ where: userId ? { userId } : {}, orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    if (a?.createdAt) earliestDates.push(new Date(a.createdAt))
  } catch {}
  try {
    const anyDb = db as any
    const a = await anyDb.flashcardSet?.findFirst({ where: userId ? { userId } : {}, orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    if (a?.createdAt) earliestDates.push(new Date(a.createdAt))
  } catch {}
  try {
    const anyDb = db as any
    const a = await anyDb.quizSet?.findFirst({ where: userId ? { userId } : {}, orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    if (a?.createdAt) earliestDates.push(new Date(a.createdAt))
  } catch {}

  const today = new Date(); today.setHours(0,0,0,0)
  let startDate = new Date(); startDate.setDate(today.getDate() - 13); startDate.setHours(0,0,0,0) // default: 14 days
  if (earliestDates.length > 0) {
    const min = new Date(Math.min(...earliestDates.map((d) => d.getTime())))
    // Cap at 180 days window for performance
    const maxWindowStart = new Date(today); maxWindowStart.setDate(today.getDate() - 179)
    startDate = min < maxWindowStart ? maxWindowStart : min
    startDate.setHours(0,0,0,0)
  }

  const days: Date[] = []
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

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

  // Totals across all time
  const totalStudyMin = sessions.reduce((acc, s) => acc + Math.max(0, Math.round(((s.lastActiveAt?.getTime?.() ?? s.createdAt.getTime()) - s.createdAt.getTime()) / 60000)), 0)
  const totalCards = sets.reduce((acc, s) => acc + (s.count ?? 0), 0)
  const totalQuizzes = quizSets.length
  const avgScore = scores.length ? Math.round(scores.reduce((a, s) => a + s.percentage, 0) / scores.length) : null
  const sinceLabel = startDate.toLocaleDateString()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Analytics</h1>
        <p className="text-sm text-muted-foreground">Study time, creation activity, and score trends</p>
      </div>
      <AnalyticsClient
        studyTimeByDay={studyTimeByDay}
        flashcardsByDay={flashcardsByDay}
        quizzesByDay={quizzesByDay}
        scoresSeries={scoresSeries}
        nextEvent={nextEvent ? { title: nextEvent.title, start: nextEvent.start.toISOString() } : null}
        totals={{ minutes: totalStudyMin, cards: totalCards, quizzes: totalQuizzes, avgScore }}
        sinceLabel={sinceLabel}
      />
    </div>
  )
}


