"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PomodoroPage() {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [longEvery, setLongEvery] = useState(4);
  const [totalCycles, setTotalCycles] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(focusMin * 60);
  const [phaseTotal, setPhaseTotal] = useState(focusMin * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("Focus");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pomodoro_settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.focusMin === 'number') setFocusMin(s.focusMin);
        if (typeof s.breakMin === 'number') setBreakMin(s.breakMin);
        if (typeof s.longBreakMin === 'number') setLongBreakMin(s.longBreakMin);
        if (typeof s.longEvery === 'number') setLongEvery(s.longEvery);
        if (typeof s.totalCycles === 'number') setTotalCycles(s.totalCycles);
        if (typeof s.label === 'string') setLabel(s.label);
      }
    } catch {}

    // Restore running session if present
    try {
      const rawState = localStorage.getItem("pomodoro_state");
      if (rawState) {
        const st = JSON.parse(rawState);
        if (st && typeof st === 'object') {
          if (st.phase === 'focus' || st.phase === 'break') setPhase(st.phase);
          if (typeof st.cycle === 'number') setCycle(st.cycle);
          if (typeof st.phaseTotal === 'number') setPhaseTotal(st.phaseTotal);
          if (typeof st.startedAt === 'number') setStartedAt(st.startedAt);
          if (typeof st.endAt === 'number') setEndAt(st.endAt);
          if (typeof st.running === 'boolean') setRunning(st.running);
          if (typeof st.label === 'string') setLabel(st.label);
          if (st.running && st.endAt) {
            const remaining = Math.max(0, Math.floor((st.endAt - Date.now()) / 1000));
            setSecondsLeft(remaining);
          } else {
            const total = (st.phase === 'focus' ? st.focusMin : (st.cycle % st.longEvery === 0 ? st.longBreakMin : st.breakMin)) * 60;
            setSecondsLeft(total);
            setPhaseTotal(total);
          }
        }
      } else {
        // initialize timers
        setSecondsLeft(focusMin * 60);
        setPhaseTotal(focusMin * 60);
      }
    } catch {
      setSecondsLeft(focusMin * 60);
      setPhaseTotal(focusMin * 60);
    }

    if (typeof window !== 'undefined' && "Notification" in window) {
      try { Notification.requestPermission().catch(() => {}); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = { focusMin, breakMin, longBreakMin, longEvery, totalCycles, label };
    try { localStorage.setItem("pomodoro_settings", JSON.stringify(s)); } catch {}
  }, [focusMin, breakMin, longBreakMin, longEvery, totalCycles, label]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(() => {
        const remaining = endAt ? Math.max(0, Math.floor((endAt - Date.now()) / 1000)) : 0;
        if (remaining <= 0) {
          if (phase === "focus") {
            persistSession();
            const isLong = cycle % longEvery === 0;
            setPhase("break");
            setLabel("Break");
            const nextTotal = (isLong ? longBreakMin : breakMin) * 60;
            setPhaseTotal(nextTotal);
            setStartedAt(Date.now());
            setEndAt(Date.now() + nextTotal * 1000);
            notify("Break time", isLong ? `Long break ${longBreakMin} min` : `Break ${breakMin} min`);
            beep();
            return nextTotal;
          } else {
            const nextCycle = cycle + 1;
            if (nextCycle > totalCycles) {
              setRunning(false);
              notify("Pomodoro complete", `${totalCycles} cycles finished`);
              beep();
              return 0;
            }
            setCycle(nextCycle);
            setPhase("focus");
            setLabel("Focus");
            const nextTotal = focusMin * 60;
            setPhaseTotal(nextTotal);
            setStartedAt(Date.now());
            setEndAt(Date.now() + nextTotal * 1000);
            notify("Focus", `Cycle ${nextCycle}/${totalCycles}`);
            beep();
            return nextTotal;
          }
        }
        return remaining;
      });
    }, 1000);
    if (!startedAt) setStartedAt(Date.now());
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, phase, cycle, focusMin, breakMin, longBreakMin, longEvery, totalCycles, startedAt, endAt]);

  useEffect(() => {
    if (!running) {
      const total = phase === "focus" ? focusMin * 60 : (cycle % longEvery === 0 ? longBreakMin : breakMin) * 60;
      setSecondsLeft(total);
      setPhaseTotal(total);
    }
  }, [focusMin, breakMin, longBreakMin, longEvery, phase, running, cycle]);

  const start = () => {
    const total = secondsLeft > 0 ? secondsLeft : (phase === 'focus' ? focusMin * 60 : (cycle % longEvery === 0 ? longBreakMin : breakMin) * 60);
    setStartedAt(Date.now());
    setEndAt(Date.now() + total * 1000);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setCycle(1);
    setPhase("focus");
    setLabel("Focus");
    const total = focusMin * 60;
    setSecondsLeft(total);
    setPhaseTotal(total);
    setStartedAt(null);
    setEndAt(null);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const persistSession = async () => {
    try {
      const duration = focusMin;
      const started = startedAt ? new Date(startedAt).toISOString() : new Date().toISOString();
      await fetch('/api/pomodoro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: "Focus", duration_min: duration, started_at: started }) });
    } catch {}
  };
  // Persist runtime state frequently so it survives refresh/tab changes
  useEffect(() => {
    const st = { running, phase, cycle, phaseTotal, startedAt, endAt, label, focusMin, breakMin, longBreakMin, longEvery, totalCycles };
    try { localStorage.setItem('pomodoro_state', JSON.stringify(st)); } catch {}
  }, [running, phase, cycle, phaseTotal, startedAt, endAt, label, focusMin, breakMin, longBreakMin, longEvery, totalCycles]);

  const strokeColor = phase === 'focus' ? 'stroke-blue-600' : 'stroke-emerald-500';

  const notify = (title: string, body: string) => {
    try {
      if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch {}
  };

  const beep = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pomodoro</h2>
          <div className="text-sm text-muted-foreground">Cycle {cycle}/{totalCycles} • {label}</div>
        </div>
        <div className="flex items-center gap-2">
          <Input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-36" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 120 120" className="h-40 w-40">
              <circle cx="60" cy="60" r="54" className="stroke-muted" strokeWidth="12" fill="none" />
              {(() => {
                const r = 54; const C = 2 * Math.PI * r; const p = Math.max(0, Math.min(1, secondsLeft / Math.max(1, phaseTotal)));
                const dash = C * p; const gap = C - dash;
                return <circle cx="60" cy="60" r={r} strokeDasharray={`${dash} ${gap}`} className={`${strokeColor} transition-[stroke-dasharray] duration-200`} strokeWidth="12" strokeLinecap="round" fill="none" transform="rotate(-90 60 60)" />;
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl md:text-4xl font-mono tabular-nums">{mm}:{ss}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {!running ? <Button onClick={start}>Start</Button> : <Button onClick={pause}>Pause</Button>}
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Focus (minutes)</div>
            <Input type="number" min={1} max={120} value={focusMin} onChange={(e) => setFocusMin(Math.max(1, Math.min(120, Number(e.target.value) || 0)))} disabled={running}  />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Break (minutes)</div>
            <Input type="number" min={1} max={60} value={breakMin} onChange={(e) => setBreakMin(Math.max(1, Math.min(60, Number(e.target.value) || 0)))} disabled={running} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Long Break (minutes)</div>
            <Input type="number" min={1} max={60} value={longBreakMin} onChange={(e) => setLongBreakMin(Math.max(1, Math.min(60, Number(e.target.value) || 0)))} disabled={running} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Long Break every (cycles)</div>
            <Input type="number" min={2} max={12} value={longEvery} onChange={(e) => setLongEvery(Math.max(2, Math.min(12, Number(e.target.value) || 0)))} disabled={running} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Cycles</div>
            <Input type="number" min={1} max={12} value={totalCycles} onChange={(e) => setTotalCycles(Math.max(1, Math.min(12, Number(e.target.value) || 0)))} disabled={running} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


