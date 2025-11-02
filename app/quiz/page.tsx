'use client';

import { QuizProvider } from '@/contexts/QuizContext';
import Quiz from '@/components/quiz/Quiz';
import { useEffect, useState } from 'react';
 
import { RecentQuizzesPanel } from '@/components/recent/RecentQuizzesPanel';

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
