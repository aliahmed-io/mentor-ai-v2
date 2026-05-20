"use client";

import Quiz from "@/components/quiz/Quiz";

import { RecentQuizzesPanel } from "@/components/recent/RecentQuizzesPanel";
import { QuizProvider } from "@/contexts/QuizContext";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <QuizProvider>
          <Quiz />
        </QuizProvider>
      </div>
      <RecentQuizzesPanel />
    </div>
  );
}
