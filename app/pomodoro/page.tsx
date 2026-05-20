"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        if (typeof s.focusMin === "number") setFocusMin(s.focusMin);
        if (typeof s.breakMin === "number") setBreakMin(s.breakMin);
        if (typeof s.longBreakMin === "number") setLongBreakMin(s.longBreakMin);
        if (typeof s.longEvery === "number") setLongEvery(s.longEvery);
        if (typeof s.totalCycles === "number") setTotalCycles(s.totalCycles);
        if (typeof s.label === "string") setLabel(s.label);
      }
    } catch {}

    // Restore running session if present
    try {
      const rawState = localStorage.getItem("pomodoro_state");
      if (rawState) {
        const st = JSON.parse(rawState);
        if (st && typeof st === "object") {
          if (st.phase === "focus" || st.phase === "break") setPhase(st.phase);
          if (typeof st.cycle === "number") setCycle(st.cycle);
          if (typeof st.phaseTotal === "number") setPhaseTotal(st.phaseTotal);
          if (typeof st.startedAt === "number") setStartedAt(st.startedAt);
          if (typeof st.endAt === "number") setEndAt(st.endAt);
          if (typeof st.running === "boolean") setRunning(st.running);
          if (typeof st.label === "string") setLabel(st.label);
          if (st.running && st.endAt) {
            const remaining = Math.max(
              0,
              Math.floor((st.endAt - Date.now()) / 1000),
            );
            setSecondsLeft(remaining);
          } else {
            const total =
              (st.phase === "focus"
                ? st.focusMin
                : st.cycle % st.longEvery === 0
                  ? st.longBreakMin
                  : st.breakMin) * 60;
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

    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMin]);

  useEffect(() => {
    const s = {
      focusMin,
      breakMin,
      longBreakMin,
      longEvery,
      totalCycles,
      label,
    };
    try {
      localStorage.setItem("pomodoro_settings", JSON.stringify(s));
    } catch {}
  }, [focusMin, breakMin, longBreakMin, longEvery, totalCycles, label]);

  const start = () => {
    const total =
      secondsLeft > 0
        ? secondsLeft
        : phase === "focus"
          ? focusMin * 60
          : (cycle % longEvery === 0 ? longBreakMin : breakMin) * 60;
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
      const started = startedAt
        ? new Date(startedAt).toISOString()
        : new Date().toISOString();
      await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "Focus",
          duration_min: duration,
          started_at: started,
        }),
      });
    } catch {}
  };
  // Persist runtime state frequently so it survives refresh/tab changes
  useEffect(() => {
    const st = {
      running,
      phase,
      cycle,
      phaseTotal,
      startedAt,
      endAt,
      label,
      focusMin,
      breakMin,
      longBreakMin,
      longEvery,
      totalCycles,
    };
    try {
      localStorage.setItem("pomodoro_state", JSON.stringify(st));
    } catch {}
  }, [
    running,
    phase,
    cycle,
    phaseTotal,
    startedAt,
    endAt,
    label,
    focusMin,
    breakMin,
    longBreakMin,
    longEvery,
    totalCycles,
  ]);

  useEffect(() => {
    if (!running) {
      const total =
        phase === "focus"
          ? focusMin * 60
          : (cycle % longEvery === 0 ? longBreakMin : breakMin) * 60;
      setSecondsLeft(total);
      setPhaseTotal(total);
    }
  }, [focusMin, breakMin, longBreakMin, longEvery, phase, running, cycle]);

  const strokeColor =
    phase === "focus"
      ? "stroke-[var(--primary)]"
      : "stroke-[var(--muted-foreground)]";

  const notify = (title: string, body: string) => {
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, { body });
      }
    } catch {}
  };

  const beep = () => {
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
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

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(() => {
        const remaining = endAt
          ? Math.max(0, Math.floor((endAt - Date.now()) / 1000))
          : 0;
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
            notify(
              "Break time",
              isLong
                ? `Long break ${longBreakMin} min`
                : `Break ${breakMin} min`,
            );
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    running,
    phase,
    cycle,
    focusMin,
    breakMin,
    longBreakMin,
    longEvery,
    totalCycles,
    startedAt,
    endAt,
  ]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-6">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-foreground/90 mb-3 select-none font-mono tracking-widest uppercase">
            Time & Focus
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Study Sanctuary Timer
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 font-light max-w-2xl leading-relaxed">
            Immerse yourself in calm, structured learning intervals designed for
            deep cognitive flow.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <span className="text-xs font-mono font-bold text-muted-foreground">
            Interval Topic:
          </span>
          <Input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-36 text-sm font-semibold bg-transparent text-foreground border-none focus:ring-0 focus:outline-none h-8 px-1"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Countdown Visualizer */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <Card className="w-full flex flex-col items-center p-8 relative overflow-hidden group border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem]">
            {/* Soft Ambient glow under the circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary opacity-[0.03] blur-3xl pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700" />

            <div className="relative h-64 w-64 md:h-72 md:w-72 flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="absolute inset-0 h-full w-full transform -rotate-90"
              >
                {/* Background track circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-[var(--muted)]"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Animated active path */}
                {(() => {
                  const r = 52;
                  const C = 2 * Math.PI * r;
                  const p = Math.max(
                    0,
                    Math.min(1, secondsLeft / Math.max(1, phaseTotal)),
                  );
                  const dash = C * p;
                  const gap = C - dash;
                  return (
                    <circle
                      cx="60"
                      cy="60"
                      r={r}
                      strokeDasharray={`${dash} ${gap}`}
                      className={`${strokeColor} transition-[stroke-dasharray] duration-500`}
                      strokeWidth="7"
                      strokeLinecap="round"
                      fill="none"
                    />
                  );
                })()}
              </svg>

              <div className="flex flex-col items-center justify-center text-center z-10">
                <span className="text-xs uppercase tracking-widest font-mono text-[var(--muted-foreground)] font-bold">
                  {phase === "focus" ? "Focus Interval" : "Break time"}
                </span>
                <div className="text-5xl md:text-6xl font-mono tracking-tighter text-[var(--foreground)] font-bold tabular-nums my-2">
                  {mm}:{ss}
                </div>
                <span className="text-xs font-serif italic text-[var(--muted-foreground)]">
                  Cycle {cycle} of {totalCycles}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-4 mt-8 w-full justify-center">
              {!running ? (
                <Button
                  onClick={start}
                  className="rounded-full px-8 py-6 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Begin Session
                </Button>
              ) : (
                <Button
                  onClick={pause}
                  className="rounded-full px-8 py-6 text-sm font-semibold bg-foreground hover:bg-foreground/90 text-card shadow-md transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause Interval
                </Button>
              )}
              <Button
                variant="outline"
                onClick={reset}
                className="rounded-full px-6 py-6 text-sm font-semibold border-border hover:bg-muted text-foreground transition-all duration-300"
              >
                Reset
              </Button>
            </div>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem]">
            <CardContent className="p-6 md:p-8 space-y-4">
              <h2 className="text-lg font-serif font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Timer Configuration
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-background px-4 py-3 rounded-xl border border-border">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Focus Interval
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Standard deep work blocks
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={focusMin}
                      onChange={(e) =>
                        setFocusMin(
                          Math.max(
                            1,
                            Math.min(120, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={running}
                      className="w-20 text-right bg-background h-8 px-2 py-1 text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-background px-4 py-3 rounded-xl border border-border">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Short Break
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Quick restorative pauses
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={breakMin}
                      onChange={(e) =>
                        setBreakMin(
                          Math.max(
                            1,
                            Math.min(60, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={running}
                      className="w-20 text-right bg-background h-8 px-2 py-1 text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-background px-4 py-3 rounded-xl border border-border">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Long Break
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Extended rest sequence
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={longBreakMin}
                      onChange={(e) =>
                        setLongBreakMin(
                          Math.max(
                            1,
                            Math.min(60, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={running}
                      className="w-20 text-right bg-background h-8 px-2 py-1 text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-background px-4 py-3 rounded-xl border border-border">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Long Break Freq.
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Trigger long break every
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={2}
                      max={12}
                      value={longEvery}
                      onChange={(e) =>
                        setLongEvery(
                          Math.max(
                            2,
                            Math.min(12, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={running}
                      className="w-20 text-right bg-background h-8 px-2 py-1 text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">c</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-background px-4 py-3 rounded-xl border border-border">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Total Cycles
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Target number of sessions
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={totalCycles}
                      onChange={(e) =>
                        setTotalCycles(
                          Math.max(
                            1,
                            Math.min(12, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={running}
                      className="w-20 text-right bg-background h-8 px-2 py-1 text-sm font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">c</span>
                  </div>
                </div>
              </div>
              {running && (
                <p className="text-[10px] text-center text-muted-foreground italic mt-2">
                  Configurations are locked while active.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
