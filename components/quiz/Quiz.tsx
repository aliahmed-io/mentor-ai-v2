'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Generating Your Quiz</h2>
            <p className="text-gray-600">Creating personalized questions based on your preferences...</p>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Analyzing Your Performance</h2>
            <p className="text-gray-600">AI is evaluating your answers and generating personalized insights...</p>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2 }}
            className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mx-auto max-w-xs"
          />
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span>Processing quiz results</span>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span>Identifying learning gaps</span>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
          </div>
        </motion.div>
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
