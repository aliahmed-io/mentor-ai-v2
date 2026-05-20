"use client";

import { CheckCircle } from "lucide-react";
import Quiz from "@/components/quiz/Quiz";
import { RecentQuizzesPanel } from "@/components/recent/RecentQuizzesPanel";
import { QuizProvider } from "@/contexts/QuizContext";

export default function Home() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-6">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-foreground/90 mb-3 select-none">
            <CheckCircle className="size-3 text-primary" /> Skill Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Quiz Generator
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 font-light max-w-2xl leading-relaxed">
            Test your knowledge. Configure dynamic quizzes to evaluate your mastery over any study topic.
          </p>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area */}
        <div className="lg:col-span-8">
          <QuizProvider>
            <Quiz />
          </QuizProvider>
        </div>

        {/* Right Sidebar: History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-card overflow-hidden p-6 md:p-8 space-y-5">
            <div className="mb-2">
              <h2 className="text-lg font-serif font-extrabold text-foreground">
                Recent Quizzes
              </h2>
              <p className="text-[11px] text-muted-foreground font-light mt-1">
                Review past assessments and scores.
              </p>
            </div>
            <RecentQuizzesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
