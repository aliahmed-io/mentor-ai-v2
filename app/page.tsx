"use client";

import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  Layout,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { MentorLogoLong } from "@/components/globals/MentorLogo";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: session } = useSession();

  // --- Interactive Chat State ---
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "user",
      text: "Explain the Calvin cycle in simple terms.",
      time: "Just now",
    },
    {
      sender: "ai",
      text: "Think of it as nature's kitchen! Inside chloroplasts, plants take carbon dioxide from the air, mix it with water, and use sunlight energy to bake organic sugars (food).",
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: "user", text: chatInput, time: "Just now" };
    setChatMessages((prev) => [...prev, userMsg]);
    const query = chatInput;
    setChatInput("");
    setIsTyping(true);

    // Dynamic responses based on user query
    setTimeout(() => {
      let reply =
        "That is a brilliant question! Let's map out a visual outline of this topic together.";
      if (
        query.toLowerCase().includes("division") ||
        query.toLowerCase().includes("cell")
      ) {
        reply =
          "Cell division (mitosis) is like photocopying a recipe book. The cell makes an exact duplicate of its DNA, splits them evenly, and pinches in the middle to create two identical cells.";
      } else if (
        query.toLowerCase().includes("study") ||
        query.toLowerCase().includes("learn")
      ) {
        reply =
          "The best study flow is the 25-minute Pomodoro block. Study intensely for 25 minutes, then take a 5-minute breather in our Soft Sage sanctuary to restore focus!";
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: reply, time: "Just now" },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // --- Interactive Outline State ---
  const [activeTopic, setActiveTopic] = useState("respiration");
  const outlines: Record<
    string,
    Array<{ num: string; title: string; length: string }>
  > = {
    respiration: [
      {
        num: "01",
        title: "Overview of Cellular Respiration",
        length: "4 slides",
      },
      {
        num: "02",
        title: "Glycolysis and Glucose Degradation",
        length: "3 slides",
      },
      {
        num: "03",
        title: "The Citric Acid (Krebs) Pathway",
        length: "5 slides",
      },
    ],
    photosynthesis: [
      { num: "01", title: "Light-Dependent Reactions", length: "3 slides" },
      { num: "02", title: "The Dark Phase: Calvin Cycle", length: "4 slides" },
      {
        num: "03",
        title: "Chloroplast Structure & Function",
        length: "3 slides",
      },
    ],
    physics: [
      { num: "01", title: "Wave-Particle Duality Concept", length: "4 slides" },
      {
        num: "02",
        title: "Schrödinger Equation Essentials",
        length: "5 slides",
      },
      { num: "03", title: "Quantum Tunneling Explained", length: "3 slides" },
    ],
  };

  // --- Interactive Timer State ---
  const [timeLeft, setTimeLeft] = useState(1500); // 25:00
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Interactive Flashcard State ---
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [studyScore, setStudyScore] = useState(94);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  const handleScoreResponse = (adjustment: number) => {
    setStudyScore((prev) => Math.min(100, Math.max(50, prev + adjustment)));
    setFlashcardFlipped(false);
    // Visual trigger
    const audioObj = typeof Audio !== "undefined" ? new Audio() : null;
    if (audioObj) {
      // safe fallback
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground overflow-x-hidden relative">
      {/* Decorative Warm Organic Floating Blobs */}
      <div className="absolute top-24 -left-36 size-[450px] rounded-full bg-primary/10 blur-3xl -z-10 animate-float" />
      <div className="absolute top-[600px] -right-36 size-[500px] rounded-full bg-primary/5 blur-3xl -z-10 animate-float-delayed" />
      <div className="absolute bottom-48 left-1/4 size-[400px] rounded-full bg-secondary/20 blur-3xl -z-10 animate-pulse-slow" />

      {/* Header Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/80 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="transition-transform active:scale-95">
            <MentorLogoLong />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a
              href="#sandbox"
              className="hover:text-foreground transition-colors"
            >
              Interactive Sandbox
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Workspace Suite
            </a>
            <a
              href="#philosophy"
              className="hover:text-foreground transition-colors"
            >
              Our Vision
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/presentation"
                className="px-6 py-2.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                Go to Workspace <ChevronRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-6 py-2.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  Get Started <ChevronRight className="size-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Editorial Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border/40 text-xs font-bold tracking-wide text-muted-foreground shadow-sm animate-float">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Your Mindful Study Sanctuary
          </div>

          {/* Luxury Serif Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-extrabold tracking-tight leading-[1.08] text-foreground max-w-4xl mx-auto">
            Your cozy study space, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-muted-foreground/80 to-primary italic font-normal">
              reimagined with warmth.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-muted-foreground leading-relaxed font-light font-sans">
            Ditch the sterile grids and stress-inducing screens. Unify your mind
            maps, slides, flashcards, and calendar events inside a soft, organic
            sanctuary.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {session ? (
              <Link
                href="/presentation"
                className="w-full sm:w-auto px-8 py-4 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Welcome back! Go to Workspace <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="w-full sm:w-auto px-8 py-4 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 animate-pulse-slow"
                >
                  Start Studying Free <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#sandbox"
                  className="w-full sm:w-auto px-8 py-4 text-sm font-bold bg-secondary text-foreground hover:bg-secondary/70 rounded-full border border-border shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                >
                  Play in the Sandbox
                </a>
              </>
            )}
          </div>
        </div>

        {/* --- Interactive Award-Winning Sandbox Preview --- */}
        <div id="sandbox" className="max-w-6xl mx-auto mt-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/40 -z-10" />

          <div className="bg-white border border-border rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-primary/10 relative overflow-hidden">
            {/* Soft floating window controls */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-primary/50" />
                <span className="size-3.5 rounded-full bg-secondary/50" />
                <span className="size-3.5 rounded-full bg-muted" />
                <div className="h-6 w-px bg-border mx-2" />
                <span className="text-xs font-bold text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Layers className="size-3 text-primary" /> Workspace Layout:
                  Live Preview
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary animate-pulse">
                ● Interactive Sandbox
              </span>
            </div>

            {/* Grid Layout of Dynamic Sandbox */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sandbox Column: Interactive Chatbot */}
              <div className="lg:col-span-4 bg-background/40 border border-border rounded-[2rem] p-5 flex flex-col justify-between min-h-[380px] shadow-sm relative">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Sanctuary Chat
                    </span>
                  </div>

                  {/* Messages container */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-[1.25rem] p-3.5 shadow-sm max-w-[85%] transition-all duration-350",
                          msg.sender === "user"
                            ? "bg-secondary text-foreground rounded-tl-none mr-auto border border-border"
                            : "bg-primary/20 rounded-tr-none text-foreground ml-auto border border-primary/10",
                        )}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="bg-primary/15 rounded-[1.25rem] rounded-tr-none p-3 max-w-[50px] ml-auto flex justify-center items-center gap-1">
                        <span
                          className="size-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="size-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="size-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Form input */}
                <form
                  onSubmit={handleSendChat}
                  className="mt-4 pt-3 border-t border-border/80 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Demo Mode: Type 'cell division'..."
                    aria-label="Demo Chat Input"
                    className="flex-1 text-xs bg-white border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                  <button
                    type="submit"
                    aria-label="Send Demo Message"
                    className="size-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-transform duration-100 active:scale-95 shadow-sm shrink-0"
                  >
                    <Send className="size-3.5" />
                  </button>
                </form>
              </div>

              {/* Center Sandbox Column: Interactive Outline Generator */}
              <div className="lg:col-span-5 bg-white border border-border rounded-[2rem] p-5 flex flex-col justify-between min-h-[380px] shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Outline Sandbox
                    </span>
                    <span className="text-[9px] font-bold text-primary bg-primary/20 px-2.5 py-0.5 rounded-full">
                      Scale-Adaptive
                    </span>
                  </div>

                  {/* Topic selection tabs */}
                  <div className="flex gap-1 bg-background/55 p-1 rounded-full border border-border/65">
                    {[
                      { key: "respiration", label: "Cell Respiration" },
                      { key: "photosynthesis", label: "Photosynthesis" },
                      { key: "physics", label: "Quantum Physics" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTopic(tab.key)}
                        aria-label={tab.label}
                        className={cn(
                          "flex-1 text-[10px] font-bold py-1.5 rounded-full transition-all duration-300",
                          activeTopic === tab.key
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic outline render */}
                  <div className="space-y-2 pt-2">
                    {outlines[activeTopic]?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-background/25 hover:bg-background/55 border border-border/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-extrabold text-primary bg-secondary/60 size-6 rounded-xl flex items-center justify-center">
                            {item.num}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md font-mono">
                          {item.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/80">
                  <Link
                    href="/presentation"
                    className="w-full py-3 text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="size-3 text-primary" /> Generate slide
                    outline inside workspace
                  </Link>
                </div>
              </div>

              {/* Right Sandbox Column: Focus timer + Flashcard */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                {/* Pomodoro Focus Timer */}
                <div className="bg-secondary/30 border border-border rounded-[2rem] p-5 flex flex-col items-center justify-center text-center gap-3 flex-1 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Focus Interval
                  </span>

                  <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono leading-none">
                    {formatTime(timeLeft)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={toggleTimer}
                      aria-label={timerRunning ? "Pause timer" : "Start timer"}
                      className="p-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-100 active:scale-95"
                    >
                      {timerRunning ? (
                        <Pause className="size-3.5" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                    </button>
                    <button
                      onClick={resetTimer}
                      aria-label="Reset timer"
                      className="p-2 rounded-full bg-white hover:bg-secondary border border-border text-muted-foreground transition-transform duration-100 active:scale-95"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spaced Recall Flashcard widget */}
                <div className="bg-background/30 border border-border rounded-[2rem] p-5 flex flex-col justify-between flex-1 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Study Index
                    </span>
                    <span className="text-[10px] font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
                      Score: {studyScore}%
                    </span>
                  </div>

                  <div className="py-2 text-center">
                    {!flashcardFlipped ? (
                      <p className="text-xs font-semibold text-foreground">
                        "What is the Krebs Cycle also referred as?"
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-primary italic">
                        "The Citric Acid Cycle!"
                      </p>
                    )}
                  </div>

                  <div>
                    {!flashcardFlipped ? (
                      <button
                        onClick={() => setFlashcardFlipped(true)}
                        aria-label="Reveal Answer"
                        className="w-full py-2 text-[10px] font-bold bg-secondary hover:bg-secondary/70 text-foreground rounded-xl border border-border/55 transition-all"
                      >
                        Reveal Answer
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleScoreResponse(2)}
                          aria-label="Mark as easy"
                          className="flex-1 py-1.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-lg shadow-sm"
                        >
                          Easy (+2)
                        </button>
                        <button
                          onClick={() => handleScoreResponse(-3)}
                          aria-label="Mark as hard"
                          className="flex-1 py-1.5 text-[9px] font-bold bg-secondary text-muted-foreground rounded-lg border border-border"
                        >
                          Hard (-3)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Suite */}
      <section
        id="features"
        className="py-24 bg-secondary/15 border-t border-b border-border px-6"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-foreground">
              A unified ecosystem of intelligent study tools.
            </h2>
            <p className="text-base text-muted-foreground font-light">
              Every tool shares visual styling, data contexts, and our trademark
              warm, organic interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Study Chatbot",
                desc: "Summarize textbooks, analyze math formulas, and query uploaded research papers in natural language.",
              },
              {
                icon: Layout,
                title: "Presentation Builder",
                desc: "Draft responsive slide designs with automatic content scaling. Export to PPTX and Google Slides perfectly.",
              },
              {
                icon: BookOpenCheck,
                title: "Smart Flashcards",
                desc: "Generate smart study decks with active recall scoring. Track your knowledge indexes over study cycles.",
              },
              {
                icon: Compass,
                title: "Quiz Generator",
                desc: "Transform lecture notes or folders of PDFs into rigorous study quizzes with multiple options.",
              },
              {
                icon: Clock,
                title: "Focus Pomodoro",
                desc: "Indulge in a curved, cozy timer. Study in phases, track breaks, and auto-log events.",
              },
              {
                icon: Calendar,
                title: "Unified Planner",
                desc: "Check study goals, schedule presentation generations, and structure exam schedules cleanly.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-border rounded-[2rem] p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-4">
                  <div className="size-12 rounded-[1.25rem] bg-background border border-border flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <feature.icon className="size-5.5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/35 border border-border/40 text-xs font-bold text-muted-foreground">
            Our Core Vision
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-foreground tracking-tight leading-snug">
            "Software should feel like an open window on a warm spring
            afternoon."
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto font-sans">
            We built Mentor AI under a simple premise: learning shouldn't feel
            stressful. By removing stark, clinical layouts and cheap cartoon
            icons, we replaced them with comfortable warm beige, Eton Blue
            accents, and gorgeous display serifs.
          </p>

          {/* Dynamic Color Palette Swatch Showcase */}
          <div className="flex items-center justify-center gap-6 pt-6">
            {[
              { color: "#F6F4F0", name: "Warm Linen", label: "Vanilla Base" },
              { color: "#DCD7CD", name: "Pale Sand", label: "Clean Detail" },
              { color: "#96c8a2", name: "Eton Blue", label: "Hero Accent" },
              { color: "#221F1C", name: "Warm Slate", label: "Primary Focus" },
            ].map((swatch, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="size-12 rounded-[1.25rem] border-2 border-white shadow-md hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: swatch.color }}
                />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                  {swatch.name}
                </span>
                <span className="text-[8px] text-muted-foreground italic">
                  {swatch.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Action Call */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto bg-primary text-primary-foreground rounded-[3rem] p-8 md:p-14 shadow-2xl shadow-primary/20 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif font-extrabold tracking-tight max-w-xl mx-auto leading-tight">
            Ready to step into your sanctuary?
          </h2>
          <p className="text-sm sm:text-base text-primary-foreground/85 max-w-lg mx-auto font-light leading-relaxed">
            Create a free account in less than thirty seconds. Start generating,
            organizing, and studying with complete calm.
          </p>
          <div className="pt-4">
            {session ? (
              <Link
                href="/presentation"
                className="inline-flex px-8 py-4 text-sm font-bold bg-white text-[#221F1C] hover:bg-neutral-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 items-center gap-2"
              >
                Go to Workspace <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex px-8 py-4 text-sm font-bold bg-white text-[#221F1C] hover:bg-neutral-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 items-center gap-2"
              >
                Start Studying Free <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="py-12 border-t border-border px-6 text-center text-xs text-muted-foreground space-y-4 max-w-6xl mx-auto">
        <p className="font-light">
          © {new Date().getFullYear()} Mentor AI Workspace. Crafted with absolute warmth by Ali Ahmed.
        </p>
        <div className="flex items-center justify-center gap-6 font-bold">
          <a href="#" className="hover:underline">
            Terms of Service
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Support Desk
          </a>
        </div>
      </footer>
    </div>
  );
}
