'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type Flashcard = { id: string; front: string; back: string; tags?: string[] }

export default function FlashcardStudyPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/flashcards/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Failed to load flashcards')
        }
        const data = await res.json()
        if (active) setCards(data?.flashcards || [])
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load flashcards')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (id) load()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    setShowBack(false)
  }, [index])

  const progress = useMemo(() => {
    if (!cards || cards.length === 0) return 0
    return ((index + 1) / cards.length) * 100
  }, [cards, index])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          Loading flashcards…
        </div>
      </div>
    )
  }

  if (error || !cards || cards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/flashcard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-xl font-semibold">Flashcards</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {error || 'No flashcards found.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const card = cards[index]

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/flashcard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-xl font-semibold">Study Flashcards</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {index + 1} / {cards.length}
        </div>
      </header>

      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-muted-foreground">Progress</div>
      </div>

      <Card className="select-none">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">{showBack ? 'Answer' : 'Question'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="min-h-[160px] whitespace-pre-wrap text-base leading-7">{showBack ? card.back : card.front}</div>
          {card.tags && card.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {card.tags.map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
            disabled={index === cards.length - 1}
            className="flex items-center gap-2"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBack((s) => !s)} className="flex items-center gap-2">
            {showBack ? <><EyeOff className="h-4 w-4" /> Hide Answer</> : <><Eye className="h-4 w-4" /> Show Answer</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setIndex(0); setShowBack(false) }} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>
      </div>
    </div>
  )
}


