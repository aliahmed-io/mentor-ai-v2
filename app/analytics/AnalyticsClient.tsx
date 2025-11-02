'use client'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Area } from 'recharts'
import { Timer, Library, ListChecks, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'

type AnalyticsProps = {
  studyTimeByDay: Array<{ day: string; minutes: number }>
  flashcardsByDay: Array<{ day: string; count: number }>
  quizzesByDay: Array<{ day: string; count: number }>
  scoresSeries: Array<{ date: string; percentage: number }>
  totals?: { minutes: number; cards: number; quizzes: number; avgScore: number | null }
  sinceLabel?: string
  nextEvent?: { title: string; start: string } | null
}

export default function AnalyticsClient({ studyTimeByDay, flashcardsByDay, quizzesByDay, scoresSeries, totals, sinceLabel, nextEvent }: AnalyticsProps) {
  const hasStudy = studyTimeByDay.some((d) => d.minutes > 0)
  const hasCards = flashcardsByDay.some((d) => d.count > 0)
  const hasQuizzes = quizzesByDay.some((d) => d.count > 0)
  const hasScores = scoresSeries.length > 0
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {totals && (
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-sm text-muted-foreground">Since {sinceLabel}</div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><Timer className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Study minutes</div>
                    <div className="text-lg font-semibold">{totals.minutes.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><Library className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Flashcards</div>
                    <div className="text-lg font-semibold">{totals.cards.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><ListChecks className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Quizzes</div>
                    <div className="text-lg font-semibold">{totals.quizzes.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg score</div>
                    <div className="text-lg font-semibold">{totals.avgScore !== null ? `${totals.avgScore}%` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Study time</div>
          {!hasStudy ? (
            <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">No study sessions yet.</div>
          ) : (
          <ChartContainer
            config={{ minutes: { label: 'Minutes', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <LineChart data={studyTimeByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Area type="monotone" dataKey="minutes" stroke="var(--color-minutes)" fill="var(--color-minutes)" fillOpacity={0.18} />
              <Line type="monotone" dataKey="minutes" stroke="var(--color-minutes)" strokeWidth={2} dot={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Flashcards created</div>
          {!hasCards ? (
            <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">No flashcards yet.</div>
          ) : (
          <ChartContainer
            config={{ count: { label: 'Cards', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <LineChart data={flashcardsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Area type="monotone" dataKey="count" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.15} />
              <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Upcoming event</div>
          {!nextEvent ? (
            <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">No upcoming events.</div>
          ) : (
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary"><CalendarIcon className="h-4 w-4" /></div>
                <div>
                  <div className="font-medium">{nextEvent.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(nextEvent.start).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Quizzes started</div>
          {!hasQuizzes ? (
            <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">No quizzes yet.</div>
          ) : (
          <ChartContainer
            config={{ count: { label: 'Quizzes', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <LineChart data={quizzesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

    
    </div>
  )
}


