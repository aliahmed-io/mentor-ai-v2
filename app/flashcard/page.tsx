'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import UploadForm from '@/components/UploadForm'
import { useRouter } from 'next/navigation'

type Flashcard = {
  id: string
  front: string
  back: string
  tags?: string[]
}

export default function FlashcardPage() {
  const router = useRouter()
  const [material, setMaterial] = useState('')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(12)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return
    // Prefill with extracted text sample; user can edit/trim
    setMaterial((prev) => (prev ? prev + '\n\n' : '') + data.text)
  }

  const generate = async () => {
    if (!material.trim()) {
      setError('Please provide study material (paste text or upload a file).')
      return
    }
    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: material.trim(), topic: topic.trim() || undefined, count }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to generate flashcards')
      }
      const data = await res.json()
      const id: string | undefined = data?.id
      if (id) {
        router.push(`/flashcard/${id}`)
      } else {
        throw new Error('Missing session id in response')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate flashcards')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Flashcard Generator</h1>
          <p className="text-sm text-muted-foreground">Create study flashcards from your notes, PDFs, docs, or images</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={4}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(4, Math.min(50, Number(e.target.value) || 0)))}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">cards</span>
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-medium">Paste study material</label>
            <Textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste relevant notes or text here..."
              className="min-h-[180px]"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Optional topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Biology - Cell Division" />
              </div>
              <div className="flex items-end">
                <Button onClick={generate} disabled={isGenerating} className="w-full">
                  {isGenerating ? 'Generating…' : 'Generate Flashcards'}
                </Button>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Or upload a file</label>
            <UploadForm onUploaded={handleUploaded} />
            <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT, JPG/PNG and more are supported.</p>
          </div>
        </CardContent>
      </Card>

      {/* Study UI moved to /flashcard/[id] */}
    </div>
  )
}

