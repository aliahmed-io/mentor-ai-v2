'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { QuizState, QuizSetup, Question, QuizResult } from '@/types/quiz';
import { analyzeQuizResults } from '@/lib/gemini';

type QuizAction =
  | { type: 'SET_SETUP'; payload: QuizSetup }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: number } }
  | { type: 'CLEAR_ANSWER'; payload: string }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'SET_RESULT'; payload: QuizResult }
  | { type: 'RESET_QUIZ' };

const initialState: QuizState = {
  setup: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  isCompleted: false,
  result: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_SETUP':
      return { ...state, setup: action.payload };
    
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    
    case 'ANSWER_QUESTION':
      const newAnswers = new Map(state.answers);
      newAnswers.set(action.payload.questionId, action.payload.answer);
      return { ...state, answers: newAnswers };
    
    case 'CLEAR_ANSWER':
      const clearedAnswers = new Map(state.answers);
      clearedAnswers.delete(action.payload);
      return { ...state, answers: clearedAnswers };
    
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          state.questions.length - 1
        ),
      };
    
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
      };
    
    case 'COMPLETE_QUIZ':
      return { ...state, isCompleted: true };
    
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    
    case 'RESET_QUIZ':
      return initialState;
    
    default:
      return state;
  }
}

interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  setSetup: (setup: QuizSetup) => void;
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: string, answer: number) => void;
  clearAnswer: (questionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeQuiz: () => void;
  calculateResult: () => Promise<void>;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const setSetup = (setup: QuizSetup) => {
    dispatch({ type: 'SET_SETUP', payload: setup });
  };

  const setQuestions = (questions: Question[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  };

  const answerQuestion = (questionId: string, answer: number) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer } });
  };

  const clearAnswer = (questionId: string) => {
    dispatch({ type: 'CLEAR_ANSWER', payload: questionId });
  };

  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const previousQuestion = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  const completeQuiz = () => {
    dispatch({ type: 'COMPLETE_QUIZ' });
  };

  const calculateResult = async () => {
    const { questions, answers, setup } = state;
    
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    const quizAnswers = [];

    for (const question of questions) {
      const userAnswer = answers.get(question.id);
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (userAnswer === undefined) {
        unanswered++;
      } else if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      quizAnswers.push({
        questionId: question.id,
        selectedAnswer: userAnswer ?? null,
        isCorrect: userAnswer !== undefined && isCorrect,
      });
    }

    const percentage = (correctAnswers / questions.length) * 100;

    // Create basic result first
    const basicResult: QuizResult = {
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      percentage,
      answers: quizAnswers,
      questions,
      weakTopics: [],
      recommendations: [],
    };

    dispatch({ type: 'SET_RESULT', payload: basicResult });

    // Generate AI-powered analysis if setup is available
    if (setup) {
      try {
        const analysis = await analyzeQuizResults(basicResult, setup);
        const enhancedResult: QuizResult = {
          ...basicResult,
          weakTopics: analysis.weakTopics,
          recommendations: analysis.recommendations,
        };
        dispatch({ type: 'SET_RESULT', payload: enhancedResult });
      } catch (error) {
        console.error('Error analyzing quiz results:', error);
        // Fall back to basic analysis
        const topicCounts: Record<string, { correct: number; total: number }> = {};

        for (const question of questions) {
          const userAnswer = answers.get(question.id);
          const isCorrect = userAnswer === question.correctAnswer;
          
          if (!topicCounts[question.topic]) {
            topicCounts[question.topic] = { correct: 0, total: 0 };
          }
          topicCounts[question.topic].total++;
          if (isCorrect) {
            topicCounts[question.topic].correct++;
          }
        }

        const weakTopics = Object.entries(topicCounts)
          .filter(([, counts]) => counts.correct / counts.total < 0.6)
          .map(([topic]) => topic);

        const recommendations = [];
        if (percentage < 50) {
          recommendations.push("Consider reviewing the fundamental concepts thoroughly");
        } else if (percentage < 70) {
          recommendations.push("Good progress! Focus on the weak areas identified");
        } else if (percentage < 90) {
          recommendations.push("Great job! Polish up on the topics you missed");
        } else {
          recommendations.push("Excellent work! You have mastered this topic");
        }

        if (weakTopics.length > 0) {
          recommendations.push(`Pay special attention to: ${weakTopics.join(", ")}`);
        }

        const fallbackResult: QuizResult = {
          ...basicResult,
          weakTopics,
          recommendations,
        };
        dispatch({ type: 'SET_RESULT', payload: fallbackResult });
      }
    }
  };

  const resetQuiz = () => {
    dispatch({ type: 'RESET_QUIZ' });
  };

  const value: QuizContextType = {
    state,
    dispatch,
    setSetup,
    setQuestions,
    answerQuestion,
    clearAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    calculateResult,
    resetQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
