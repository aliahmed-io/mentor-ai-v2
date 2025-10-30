'use client';

import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, AlertCircle, RotateCcw, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuizResult } from '@/types/quiz';

interface QuizResultsProps {
  result: QuizResult;
  onRetakeQuiz: () => void;
  onNewQuiz: () => void;
}

export default function QuizResults({ result, onRetakeQuiz, onNewQuiz }: QuizResultsProps) {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeEmoji = (percentage: number) => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🎉';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '📚';
    return '💪';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 80) return 'Great Job!';
    if (percentage >= 70) return 'Good Work!';
    if (percentage >= 60) return 'Keep Learning!';
    return 'Practice More!';
  };

  return (
    <div className="p-2 md:p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            {getGradeEmoji(result.percentage)}
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-xl text-gray-600">Here&apos;s how you performed</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Score Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Your Score
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div>
                  <div className={`text-5xl font-bold ${getGradeColor(result.percentage)}`}>
                    {Math.round(result.percentage)}%
                  </div>
                  <div className={`text-xl font-semibold ${getGradeColor(result.percentage)}`}>
                    {getGradeText(result.percentage)}
                  </div>
                </div>

                <Progress value={result.percentage} className="h-4" />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                    <div className="text-gray-600">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.incorrectAnswers}</div>
                    <div className="text-gray-600">Incorrect</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{result.unanswered}</div>
                    <div className="text-gray-600">Skipped</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={onRetakeQuiz}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                  <Button
                    onClick={onNewQuiz}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    New Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Question Review */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Question Review
                </CardTitle>
                <CardDescription>
                  Review your answers and learn from explanations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {result.questions.map((question, index) => {
                    const answer = result.answers.find(a => a.questionId === question.id);
                    const userAnswer = answer?.selectedAnswer;
                    const isCorrect = answer?.isCorrect ?? false;
                    const wasAnswered = userAnswer !== null && userAnswer !== undefined;

                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-4 rounded-lg border-l-4 ${
                          !wasAnswered
                            ? 'border-l-gray-400 bg-gray-50'
                            : isCorrect
                            ? 'border-l-green-500 bg-green-50'
                            : 'border-l-red-500 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {!wasAnswered ? (
                              <AlertCircle className="w-5 h-5 text-gray-500" />
                            ) : isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 mb-2">
                              {index + 1}. {question.question}
                            </div>
                            
                            {!wasAnswered ? (
                              <div className="text-gray-600 mb-2">
                                <span className="font-medium">Not answered</span>
                              </div>
                            ) : (
                              <div className="mb-2">
                                <div className="text-sm text-gray-600">
                                  Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                    {question.options[userAnswer!]}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="text-sm text-gray-600">
                                    Correct answer: <span className="text-green-600">
                                      {question.options[question.correctAnswer]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {(!wasAnswered || !isCorrect) && (
                              <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-l-blue-400">
                                <strong>Explanation:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recommendations */}
        {(result.weakTopics.length > 0 || result.recommendations.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized suggestions to improve your performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.weakTopics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2">Areas for Improvement:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.weakTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Study Tips:</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-500 mt-1">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
