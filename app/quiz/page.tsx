'use client';

import { QuizProvider } from '@/contexts/QuizContext';
import Quiz from '@/components/quiz/Quiz';

export default function Home() {
  return (
    <QuizProvider>
      <Quiz />
    </QuizProvider>
  );
}
