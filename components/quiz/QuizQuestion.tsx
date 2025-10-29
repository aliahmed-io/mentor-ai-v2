'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Question } from '@/types/quiz';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  onClearAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  isAnalyzing?: boolean;
}

export default function QuizQuestion({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onClearAnswer,
  onNext,
  onPrevious,
  onFinish,
  canGoNext,
  canGoPrevious,
  isLastQuestion,
  isAnalyzing = false,
}: QuizQuestionProps) {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <div className="text-sm text-gray-600">
              Topic: <span className="font-semibold text-purple-600">{question.topic}</span>
            </div>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-800 leading-relaxed">
                  {question.question}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Answer Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAnswerSelect(index)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedAnswer === index
                          ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === index
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedAnswer === index && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <span className="flex-1 text-lg">{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Clear Answer Button */}
                {selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={onClearAnswer}
                      className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear Selection
                    </Button>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {isLastQuestion ? (
                      <Button
                        onClick={onFinish}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Finish Quiz'
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={onNext}
                        disabled={!canGoNext}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Question Navigation Dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <div className="flex gap-2 p-4 bg-white/80 rounded-full shadow-lg backdrop-blur-sm">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-purple-500 scale-125'
                    : index < currentIndex
                    ? 'bg-green-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
