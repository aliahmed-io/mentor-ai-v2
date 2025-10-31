'use client'
import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

type ChatProps = {
  sessionId: string
}

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage.content }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch response')
      }

      const data = await res.json()
      const aiMessage: Message = { role: 'assistant', content: data.reply || 'No reply.' }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error fetching response. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Load history when sessionId changes
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!sessionId) return
      try {
        const res = await fetch(`/api/chat/session/${sessionId}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        const msgs: Message[] = Array.isArray(data?.messages) ? data.messages : []
        setMessages(msgs)
      } catch {}
    })()
    return () => { active = false }
  }, [sessionId])

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-4 max-h-[60vh] overflow-y-auto pr-2">
        {messages.length === 0 && (
          <div className="py-10 text-center text-sm text-foreground">
            <div className="mb-3 text-4xl">💬</div>
            <p>Start a conversation about your uploaded document!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground border'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none prose-headings:my-2 prose-p:my-2 prose-li:my-1 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'assistant' && (
              <div className="mt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/chat/docs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId, title: 'AI Note', content: msg.content }),
                      })
                      if (!res.ok) throw new Error('Failed to save')
                      toast({ title: 'Saved', description: 'Assistant message saved as document.' })
                    } catch (e: any) {
                      toast({ title: 'Failed to save', description: e.message || 'Error', variant: 'destructive' })
                    }
                  }}
                >Save as doc</Button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl border bg-muted px-4 py-3 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your uploaded file..."
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !input.trim()}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Sending
            </span>
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </div>
  )
}
