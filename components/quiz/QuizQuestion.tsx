"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Question } from "@/types/quiz";

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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header with Progress */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 bg-[var(--card)]"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest font-mono text-[var(--muted-foreground)] font-bold">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div className="text-xs font-mono font-bold text-[var(--muted-foreground)]">
              Topic:{" "}
              <span className="font-sans font-bold text-[var(--foreground)] bg-[var(--background)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                {question.topic}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-[var(--muted)]" />
        </motion.div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="premium-card p-8 bg-[var(--card)] space-y-6"
          >
            <div className="pb-2">
              <h2 className="text-2xl md:text-3xl font-serif font-bold leading-relaxed text-[var(--foreground)]">
                {question.question}
              </h2>
            </div>
            {/* Answer Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onAnswerSelect(index)}
                  className={`w-full rounded-2xl border p-5 text-left transition duration-200 flex items-center justify-between ${
                    selectedAnswer === index
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm ring-1 ring-[var(--primary)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--background)]"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                        selectedAnswer === index
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--background)]"
                      }`}
                    >
                      {selectedAnswer === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        </motion.div>
                      )}
                    </div>
                    <span className="flex-1 text-base font-semibold leading-snug">
                      {option}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Clear Answer Button */}
            {selectedAnswer !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center pt-2"
              >
                <Button
                  variant="outline"
                  onClick={onClearAnswer}
                  className="rounded-full border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold px-4 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Selection
                </Button>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="rounded-full border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold px-5 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <div className="flex gap-3">
                {isLastQuestion ? (
                  <Button
                    onClick={onFinish}
                    disabled={isAnalyzing}
                    className="rounded-full bg-[var(--foreground)] hover:bg-[var(--foreground)]/90 text-[var(--card)] text-xs font-semibold px-6 shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Finish Quiz"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-xs font-semibold px-6 shadow-md flex items-center gap-1.5"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Question Navigation Dots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="flex gap-2.5 rounded-full bg-[var(--card)] px-5 py-3.5 border border-[var(--border)] shadow-xs">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-[var(--primary)] scale-125 ring-2 ring-[var(--primary)]/30"
                    : index < currentIndex
                      ? "bg-[var(--muted-foreground)]"
                      : "bg-[var(--muted)]"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
