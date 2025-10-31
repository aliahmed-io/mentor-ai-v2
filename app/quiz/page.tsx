'use client';

import { QuizProvider } from '@/contexts/QuizContext';
import Quiz from '@/components/quiz/Quiz';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [recent, setRecent] = useState<Array<{ id: string; topic: string; difficulty: string; questionCount: number; createdAt: string }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/quiz/recent?limit=10', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setRecent(data);
      } catch {}
    })();
    return () => { active = false };
  }, []);

  return (
    <div className="space-y-6">
      <QuizProvider>
        <Quiz />
      </QuizProvider>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Recent quizzes</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent quizzes yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {recent.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="truncate">
                  <span className="font-medium">{q.topic}</span>
                  <span className="ml-2 text-muted-foreground">{q.difficulty} • {q.questionCount} questions</span>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <a href={`/quiz/${q.id}`}>Open</a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
