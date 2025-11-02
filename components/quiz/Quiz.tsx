'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { QuizSetup as QuizSetupType } from '@/types/quiz';
import { useQuiz } from '@/contexts/QuizContext';
import { generateQuizQuestions } from '@/lib/gemini';
import QuizSetup from './QuizSetup';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';

type QuizPhase = 'setup' | 'questions' | 'results';

export default function Quiz() {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const {
    state,
    setSetup,
    setQuestions,
    answerQuestion,
    clearAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    calculateResult,
    resetQuiz,
  } = useQuiz();

  const handleSetupComplete = async (setup: QuizSetupType) => {
    setIsLoading(true);
    setSetup(setup);

    try {
      // Generate questions using Gemini API
      const questions = await generateQuizQuestions(setup);
      setQuestions(questions);
      setPhase('questions');
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      alert('Failed to generate quiz questions. Please check your internet connection and try again.');
      setPhase('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    answerQuestion(currentQuestion.id, answerIndex);
  };

  const handleClearAnswer = () => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    clearAnswer(currentQuestion.id);
  };

  const handleFinishQuiz = async () => {
    setIsAnalyzing(true);
    completeQuiz();
    
    try {
      await calculateResult();
      setPhase('results');
    } catch (error) {
      console.error('Error calculating results:', error);
      alert('Failed to analyze quiz results. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetakeQuiz = () => {
    resetQuiz();
    if (state.setup) {
      handleSetupComplete(state.setup);
    }
  };

  const handleNewQuiz = () => {
    resetQuiz();
    setPhase('setup');
  };

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const selectedAnswer = currentQuestion ? state.answers.get(currentQuestion.id) : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating quiz…
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing results…
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <QuizSetup onSetupComplete={handleSetupComplete} />
        </motion.div>
      )}

      {phase === 'questions' && currentQuestion && (
        <motion.div
          key="questions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <QuizQuestion
            question={currentQuestion}
            currentIndex={state.currentQuestionIndex}
            totalQuestions={state.questions.length}
            selectedAnswer={selectedAnswer ?? null}
            onAnswerSelect={handleAnswerSelect}
            onClearAnswer={handleClearAnswer}
            onNext={nextQuestion}
            onPrevious={previousQuestion}
            onFinish={handleFinishQuiz}
            canGoNext={state.currentQuestionIndex < state.questions.length - 1}
            canGoPrevious={state.currentQuestionIndex > 0}
            isLastQuestion={state.currentQuestionIndex === state.questions.length - 1}
            isAnalyzing={isAnalyzing}
          />
        </motion.div>
      )}

      {phase === 'results' && state.result && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <QuizResults
            result={state.result}
            onRetakeQuiz={handleRetakeQuiz}
            onNewQuiz={handleNewQuiz}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
