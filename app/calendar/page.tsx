'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type EventItem = { id: string; title: string; description?: string | null; start: string; end: string; allDay: boolean }

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<EventItem[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  const monthRange = useMemo(() => {
    const d = new Date(date)
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { from, to }
  }, [date])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const qs = `from=${monthRange.from.toISOString()}&to=${monthRange.to.toISOString()}`
        const res = await fetch(`/api/calendar/events?${qs}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) setEvents(data)
      } catch {}
    })()
    return () => { active = false }
  }, [monthRange])

  const selectedDayEvents = useMemo(() => {
    const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
    return events.filter(e => {
      const sd = new Date(e.start)
      return sd.getFullYear() === y && sd.getMonth() === m && sd.getDate() === d
    })
  }, [events, date])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return [...events]
      .filter((e) => new Date(e.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5)
  }, [events])

  const createEvent = async () => {
    if (!title.trim()) return
    const start = new Date(date)
    const end = new Date(date)
    if (!allDay) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      start.setHours(sh, sm, 0, 0)
      end.setHours(eh, em, 0, 0)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: desc.trim() || null, start, end, allDay }),
    })
    if (res.ok) {
      setOpen(false)
      setTitle('')
      setDesc('')
      // refresh list
      const qs = `from=${monthRange.from.toISOString()}&to=${monthRange.to.toISOString()}`
      const r2 = await fetch(`/api/calendar/events?${qs}`, { cache: 'no-store' })
      if (r2.ok) setEvents(await r2.json())
    }
  }

  const removeEvent = async (id: string) => {
    const r = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' })
    if (r.ok) setEvents((evs) => evs.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">Plan sessions and remember important dates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}>{'<'}</Button>
          <div className="w-28 text-center text-sm text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}>{'>'}</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Calendar</div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Add Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">All day</Label>
                    <Switch checked={allDay} onCheckedChange={setAllDay} />
                  </div>
                  {!allDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Start</Label>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>End</Label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={createEvent}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Events on {date.toLocaleDateString()}</div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {selectedDayEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <div className="font-medium">{e.title}</div>
                      {e.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">{e.description}</div>
                      )}
                    <div className="text-xs text-muted-foreground">
                      {e.allDay ? 'All day' : `${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeEvent(e.id)}>Delete</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-medium">Upcoming</div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {upcoming.map((e) => (
                <li key={e.id} className="px-4 py-2 text-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.start).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


