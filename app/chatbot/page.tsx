'use client'
import Chat from '@/components/Chat'
import UploadForm from '@/components/UploadForm'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [recentDocs, setRecentDocs] = useState<Array<{ id: string; title: string; createdAt: string }>>([])

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return
    setSessionId(data.sessionId)
    setFilePreview(data.text)
    try { localStorage.setItem('chat_session_id', data.sessionId) } catch {}
  }

  const reset = () => {
    setSessionId(null)
    setFilePreview(null)
    try { localStorage.removeItem('chat_session_id') } catch {}
  }

  useEffect(() => {
    try {
      const sid = localStorage.getItem('chat_session_id')
      if (sid) setSessionId(sid)
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const r = await fetch('/api/chat/docs?limit=10', { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        if (active) setRecentDocs(d)
      } catch {}
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tutor Chatbot</h1>
          <p className="text-sm text-muted-foreground">Upload documents and chat with AI</p>
        </div>
        <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Supports PDF, PPTX, DOCX, TXT, Images (OCR)
        </div>
      </header>

      {!sessionId && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4 text-4xl">📄</div>
            <h2 className="text-xl font-semibold">Upload a file to get started</h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
              Drop a PDF, PPTX, DOCX, TXT or an image. Text will be extracted and used as context for the chatbot.
            </p>
            <div className="mx-auto mt-4 max-w-xl">
              <UploadForm onUploaded={handleUploaded} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: Large files may be truncated; for long documents we recommend RAG/chunking
            </p>
          </CardContent>
        </Card>
      )}

      {sessionId && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md border bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <strong>Session:</strong>
              <code className="ml-2 rounded bg-background px-2 py-0.5 text-xs">{sessionId}</code>
            </div>
            <Button variant="destructive" size="sm" onClick={reset}>Reset session</Button>
          </div>

          {filePreview && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <strong className="text-green-700">Document excerpt (first 1k chars)</strong>
              <pre className="mt-2 max-h-56 overflow-auto rounded border bg-background p-3 text-sm leading-relaxed">
                {filePreview}
              </pre>
            </div>
          )}

          <Chat sessionId={sessionId} />
        </section>
      )}

      <footer className="rounded-md border p-4 text-xs text-muted-foreground">
        <div className="mb-2 font-medium">Notes:</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>In-memory sessions — restart loses data. Use Redis for persistence.</li>
          <li>OCR on images uses tesseract.js; it can be slow for many images.</li>
          <li>I can add chunking + vector store (Milvus/Weaviate/Redis) for long docs.</li>
        </ul>
      </footer>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Recent documents</h3>
        {recentDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent documents.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {recentDocs.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="truncate"><span className="font-medium">{d.title}</span></div>
                <a className="text-primary hover:underline" href={`/api/chat/docs/${d.id}`} target="_blank" rel="noopener noreferrer">Open</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
