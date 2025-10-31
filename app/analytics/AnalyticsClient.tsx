'use client'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type AnalyticsProps = {
  studyTimeByDay: Array<{ day: string; minutes: number }>
  flashcardsByDay: Array<{ day: string; count: number }>
  quizzesByDay: Array<{ day: string; count: number }>
  scoresSeries: Array<{ date: string; percentage: number }>
}

export default function AnalyticsClient({ studyTimeByDay, flashcardsByDay, quizzesByDay, scoresSeries }: AnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Study time (last 14 days)</div>
          <ChartContainer
            config={{ minutes: { label: 'Minutes', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <LineChart data={studyTimeByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Line type="monotone" dataKey="minutes" stroke="var(--color-minutes)" strokeWidth={2} dot={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Flashcards created</div>
          <ChartContainer
            config={{ count: { label: 'Cards', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <BarChart data={flashcardsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4,4,0,0]} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Quizzes started</div>
          <ChartContainer
            config={{ count: { label: 'Quizzes', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <BarChart data={quizzesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4,4,0,0]} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Score trend</div>
          <ChartContainer
            config={{ percentage: { label: 'Score %', color: 'hsl(var(--primary))' } }}
            className="w-full"
          >
            <LineChart data={scoresSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <Line type="monotone" dataKey="percentage" stroke="var(--color-percentage)" strokeWidth={2} dot />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}


