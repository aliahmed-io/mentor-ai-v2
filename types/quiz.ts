export interface QuizSetup {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  studyMaterial?: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  percentage: number;
  answers: QuizAnswer[];
  questions: Question[];
  weakTopics: string[];
  recommendations: string[];
}

export interface QuizState {
  setup: QuizSetup | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, number>;
  isCompleted: boolean;
  result: QuizResult | null;
}
