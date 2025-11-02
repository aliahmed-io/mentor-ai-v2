'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="p-2 md:p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header with Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <div className="text-sm text-muted-foreground">
              Topic: <span className="font-semibold text-foreground">{question.topic}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <div className="pb-2">
                <div className="text-2xl font-bold leading-relaxed text-foreground">
                  {question.question}
                </div>
              </div>
                {/* Answer Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAnswerSelect(index)}
                      className={`w-full rounded-md border p-4 text-left transition ${
                        selectedAnswer === index
                          ? 'border-primary bg-muted shadow-sm'
                          : 'border-border hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            selectedAnswer === index
                              ? 'border-primary bg-primary'
                              : 'border-border'
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
                    <Button variant="outline" onClick={onClearAnswer} className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Clear Selection
                    </Button>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t">
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
                      <Button onClick={onFinish} disabled={isAnalyzing} className="px-8 disabled:opacity-50 disabled:cursor-not-allowed">
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
                      <Button onClick={onNext} disabled={!canGoNext} className="flex items-center gap-2">
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                </div>
              
          </motion.div>
        </AnimatePresence>

        {/* Question Navigation Dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <div className="flex gap-2 rounded-full bg-card p-4 shadow-sm">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-primary scale-125'
                    : index < currentIndex
                    ? 'bg-muted-foreground'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
