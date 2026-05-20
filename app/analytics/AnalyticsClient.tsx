"use client";
import {
  Award,
  Calendar as CalendarIcon,
  Library,
  ListChecks,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type AnalyticsProps = {
  studyTimeByDay: Array<{ day: string; minutes: number }>;
  flashcardsByDay: Array<{ day: string; count: number }>;
  quizzesByDay: Array<{ day: string; count: number }>;
  scoresSeries: Array<{ date: string; percentage: number }>;
  totals?: {
    minutes: number;
    cards: number;
    quizzes: number;
    avgScore: number | null;
  };
  sinceLabel?: string;
  nextEvent?: { title: string; start: string } | null;
};

export default function AnalyticsClient({
  studyTimeByDay,
  flashcardsByDay,
  quizzesByDay,
  scoresSeries,
  totals,
  sinceLabel,
  nextEvent,
}: AnalyticsProps) {
  const hasStudy = studyTimeByDay.some((d) => d.minutes > 0);
  const hasCards = flashcardsByDay.some((d) => d.count > 0);
  const hasQuizzes = quizzesByDay.some((d) => d.count > 0);
  const _hasScores = scoresSeries.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Work Area (Left 8 Cols): Charts */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Study Time Chart */}
          <Card className="border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden md:col-span-2">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Timer className="size-4 text-primary" /> Daily Focus Volume
                </h3>
              </div>
              {!hasStudy ? (
                <div className="rounded-2xl border border-border/80 bg-background/20 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[220px]">
                  <Sparkles className="size-5 text-primary/40 animate-pulse" />
                  No focus intervals logged yet. Start a pomodoro timer to log
                  metrics!
                </div>
              ) : (
                <ChartContainer
                  config={{
                    minutes: { label: "Minutes", color: "var(--primary)" },
                  }}
                  className="w-full h-[220px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={studyTimeByDay}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 3,
                          fill: "hsl(var(--card))",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 0,
                          fill: "hsl(var(--foreground))",
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Flashcards Created Chart */}
          <Card className="border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Library className="size-4 text-primary" /> Decks Created
                </h3>
              </div>
              {!hasCards ? (
                <div className="rounded-2xl border border-border/80 bg-background/20 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[220px]">
                  <Sparkles className="size-5 text-primary/40 animate-pulse" />
                  No flashcards created yet. Craft your first smart study deck!
                </div>
              ) : (
                <ChartContainer
                  config={{
                    count: { label: "Cards", color: "var(--primary)" },
                  }}
                  className="w-full h-[220px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={flashcardsByDay}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 3,
                          fill: "hsl(var(--card))",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 0,
                          fill: "hsl(var(--foreground))",
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Quizzes Started Chart */}
          <Card className="border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ListChecks className="size-4 text-primary" /> Quizzes
                  Evaluated
                </h3>
              </div>
              {!hasQuizzes ? (
                <div className="rounded-2xl border border-border/80 bg-background/20 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[220px]">
                  <Sparkles className="size-5 text-primary/40 animate-pulse" />
                  No quiz metrics recorded yet. Take an online exam to start!
                </div>
              ) : (
                <ChartContainer
                  config={{
                    count: { label: "Quizzes", color: "var(--primary)" },
                  }}
                  className="w-full h-[220px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={quizzesByDay}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 3,
                          fill: "hsl(var(--card))",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 0,
                          fill: "hsl(var(--foreground))",
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar (Right 4 Cols): Summary & Upcoming Event */}
      <div className="lg:col-span-4 space-y-6">
        {totals && (
          <div className="rounded-[2rem] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-card overflow-hidden p-6 md:p-8 space-y-5">
            <div className="space-y-1.5 pb-2 border-b border-border/40">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Active Window
              </span>
              <div className="text-sm font-bold text-foreground">
                Since {sinceLabel}
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-3.5 bg-background/25 border border-border/50 rounded-2xl p-4 hover:bg-background/40 transition-colors">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Study Time
                  </div>
                  <div className="text-xl font-extrabold text-foreground">
                    {totals.minutes.toLocaleString()}{" "}
                    <span className="text-xs font-medium text-muted-foreground">
                      m
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-background/25 border border-border/50 rounded-2xl p-4 hover:bg-background/40 transition-colors">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Library className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Flashcards
                  </div>
                  <div className="text-xl font-extrabold text-foreground">
                    {totals.cards.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-background/25 border border-border/50 rounded-2xl p-4 hover:bg-background/40 transition-colors">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Quizzes
                  </div>
                  <div className="text-xl font-extrabold text-foreground">
                    {totals.quizzes.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-background/25 border border-border/50 rounded-2xl p-4 hover:bg-background/40 transition-colors">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Avg Score
                  </div>
                  <div className="text-xl font-extrabold text-foreground">
                    {totals.avgScore !== null ? `${totals.avgScore}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Event Card */}
        <Card className="border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 md:p-8 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" /> Calendar
                  Alert
                </h3>
              </div>
              {!nextEvent ? (
                <div className="rounded-2xl border border-border/80 bg-background/20 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[160px]">
                  No upcoming deadlines or scheduled study events found.
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-background/30 border border-border/50 p-5 hover:bg-background/50 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-foreground leading-snug">
                        {nextEvent.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(nextEvent.start).toLocaleString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/30 text-center">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Add study blocks in the Sanctuary Planner to keep metrics
                synchronized.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
