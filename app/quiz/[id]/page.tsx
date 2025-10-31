'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Question, QuizResult } from '@/types/quiz'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizResults from '@/components/quiz/QuizResults'

export default function QuizStudyPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Map<string, number>>(new Map())
  const [result, setResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/quiz/${id}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load quiz')
        const data = await res.json()
        if (!active) return
        setQuestions(Array.isArray(data?.questions) ? data.questions : [])
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load quiz')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  const selectedAnswer = useMemo(() => {
    const q = questions[idx]
    return q ? (answers.has(q.id) ? (answers.get(q.id) as number) : null) : null
  }, [questions, idx, answers])

  const onAnswerSelect = (answerIndex: number) => {
    const q = questions[idx]
    if (!q) return
    const next = new Map(answers)
    next.set(q.id, answerIndex)
    setAnswers(next)
  }

  const onClearAnswer = () => {
    const q = questions[idx]
    if (!q) return
    const next = new Map(answers)
    next.delete(q.id)
    setAnswers(next)
  }

  const onFinish = () => {
    const total = questions.length
    let correct = 0
    let incorrect = 0
    let unanswered = 0
    const ansList = questions.map((q) => {
      const sel = answers.has(q.id) ? (answers.get(q.id) as number) : null
      const isCorrect = sel !== null && sel === q.correctAnswer
      if (sel === null || sel === undefined) unanswered++
      else if (isCorrect) correct++
      else incorrect++
      return { questionId: q.id, selectedAnswer: sel, isCorrect }
    })
    const percentage = total === 0 ? 0 : (correct / total) * 100
    const r: QuizResult = {
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unanswered,
      percentage,
      answers: ansList,
      questions,
      weakTopics: [],
      recommendations: [],
    }
    setResult(r)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/quiz"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-xl font-semibold">Quiz</h1>
        </div>
        <p className="text-sm text-muted-foreground">{error || 'No quiz found.'}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/quiz"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-xl font-semibold">Quiz Results</h1>
        </div>
        <QuizResults result={result} onRetakeQuiz={() => { setResult(null); setIdx(0); setAnswers(new Map()) }} onNewQuiz={() => { window.location.href = '/quiz' }} />
      </div>
    )
  }

  const q = questions[idx]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/quiz"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-xl font-semibold">Study Quiz</h1>
      </div>
      <QuizQuestion
        question={q}
        currentIndex={idx}
        totalQuestions={questions.length}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={onAnswerSelect}
        onClearAnswer={onClearAnswer}
        onNext={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
        onPrevious={() => setIdx((i) => Math.max(0, i - 1))}
        onFinish={onFinish}
        canGoNext={idx < questions.length - 1}
        canGoPrevious={idx > 0}
        isLastQuestion={idx === questions.length - 1}
        isAnalyzing={false}
      />
    </div>
  )
}


