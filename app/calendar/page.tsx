"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  start: string;
  end: string;
  allDay: boolean;
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const monthRange = useMemo(() => {
    const d = new Date(date);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from, to };
  }, [date]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const qs = `from=${monthRange.from.toISOString()}&to=${monthRange.to.toISOString()}`;
        const res = await fetch(`/api/calendar/events?${qs}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setEvents(data);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [monthRange]);

  const selectedDayEvents = useMemo(() => {
    const y = date.getFullYear(),
      m = date.getMonth(),
      d = date.getDate();
    return events.filter((e) => {
      const sd = new Date(e.start);
      return (
        sd.getFullYear() === y && sd.getMonth() === m && sd.getDate() === d
      );
    });
  }, [events, date]);

  // Mark days with events for calendar modifiers
  const daysWithEvents = useMemo(() => {
    const map = new Map<string, Date>();
    for (const e of events) {
      const d = new Date(e.start);
      d.setHours(0, 0, 0, 0);
      map.set(d.toISOString(), d);
    }
    return Array.from(map.values());
  }, [events]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [events]);

  const createEvent = async () => {
    if (!title.trim()) return;
    const start = new Date(date);
    const end = new Date(date);
    if (!allDay) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      start.setHours(sh, sm, 0, 0);
      end.setHours(eh, em, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: desc.trim() || null,
        start,
        end,
        allDay,
      }),
    });
    if (res.ok) {
      setOpen(false);
      setTitle("");
      setDesc("");
      // refresh list
      const qs = `from=${monthRange.from.toISOString()}&to=${monthRange.to.toISOString()}`;
      const r2 = await fetch(`/api/calendar/events?${qs}`, {
        cache: "no-store",
      });
      if (r2.ok) setEvents(await r2.json());
    }
  };

  const removeEvent = async (id: string) => {
    const r = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    if (r.ok) setEvents((evs) => evs.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-[var(--border)] pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-mono">
            Planning & Organization
          </span>
          <h1 className="text-4xl font-serif font-bold text-[var(--foreground)] mt-1">
            Study Sanctuary Schedule
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Coordinate your study sessions, set goals, and reflect on your
            milestones in a serene environment.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 bg-[var(--card)] px-4 py-2 rounded-2xl border border-[var(--border)] shadow-sm self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(new Date())}
            className="rounded-xl px-4 border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold"
          >
            Today
          </Button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
              }
              className="h-8 w-8 rounded-lg hover:bg-[var(--muted)] text-[var(--foreground)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <div className="min-w-28 text-center text-xs font-mono font-bold text-[var(--foreground)]">
              {date.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
              }
              className="h-8 w-8 rounded-lg hover:bg-[var(--muted)] text-[var(--foreground)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Side: Dynamic Calendar */}
        <div className="md:col-span-7">
          <div className="premium-card p-5 bg-[var(--card)] relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-[0.02] rounded-full blur-2xl pointer-events-none" />
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="w-full [--cell-size:2.5rem] md:[--cell-size:3rem] mx-auto"
              classNames={{
                root: "w-full",
                months: "relative flex w-full flex-col gap-4 md:flex-row",
                month: "flex w-full flex-col gap-4",
              }}
              modifiers={{ hasEvent: daysWithEvents }}
            />
          </div>
        </div>

        {/* Right Side: Selected Day Events & Add */}
        <div className="md:col-span-5 space-y-6">
          <div className="premium-card p-6 bg-[var(--card)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[var(--foreground)]">
                  Daily Planner
                </h3>
                <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                  {date.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-xs font-semibold px-4 shadow-sm"
                  >
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-[var(--border)] bg-[var(--card)] max-w-md p-6">
                  <DialogHeader className="border-b border-[var(--border)] pb-3 mb-4">
                    <DialogTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">
                      Create Schedule Item
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[var(--foreground)]">
                        Title
                      </Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event title (e.g. Organic Chemistry Review)"
                        className="rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[var(--foreground)]">
                        Description
                      </Label>
                      <Textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Optional notes or outline"
                        className="rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background text-sm min-h-[80px]"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                      <div>
                        <Label className="text-xs font-bold text-[var(--foreground)]">
                          All-Day Event
                        </Label>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          Lock interval to full 24 hours
                        </p>
                      </div>
                      <Switch checked={allDay} onCheckedChange={setAllDay} />
                    </div>
                    {!allDay && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[var(--foreground)]">
                            Start Time
                          </Label>
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[var(--foreground)]">
                            End Time
                          </Label>
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-full border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createEvent}
                        className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-xs font-semibold px-6 shadow-sm"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--muted-foreground)] italic">
                No events planned for this date.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedDayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-[var(--foreground)]">
                        {e.title}
                      </div>
                      {e.description && (
                        <div className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                          {e.description}
                        </div>
                      )}
                      <div className="text-[9px] font-mono text-[var(--muted-foreground)] flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-[var(--primary)]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {e.allDay
                          ? "All day"
                          : `${new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEvent(e.id)}
                      className="text-xs text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/5 rounded-lg px-2 h-7"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Upcoming Schedule Overview */}
      <div className="premium-card p-6 bg-[var(--card)] space-y-4">
        <h3 className="font-serif font-bold text-lg text-[var(--foreground)] border-b border-[var(--border)] pb-3">
          Upcoming Schedule Overview
        </h3>
        {upcoming.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--muted-foreground)] italic">
            No upcoming events on the horizon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <div
                key={e.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[var(--primary)] opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="font-bold text-sm text-[var(--foreground)] line-clamp-1 pl-1">
                  {e.title}
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] pl-1 mt-1 font-mono flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(e.start).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
