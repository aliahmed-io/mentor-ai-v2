'use client'
import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

  return (
    <div style={{ 
      border: '1px solid #e9ecef', 
      borderRadius: '12px', 
      padding: '20px', 
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          marginBottom: '20px',
          paddingRight: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e0 #f7fafc'
        }}
      >
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#333',
            padding: '40px 20px',
            fontSize: '1rem'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ color: '#333', margin: 0 }}>Start a conversation about your uploaded document!</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#f8f9fa',
                color: msg.role === 'user' ? '#fff' : '#333',
                wordWrap: 'break-word',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                boxShadow: msg.role === 'user' 
                  ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: msg.role === 'assistant' ? '1px solid #e9ecef' : 'none'
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Style markdown elements
                    h1: ({children}) => <h1 style={{fontSize: '1.2rem', fontWeight: '600', margin: '8px 0', color: '#333'}}>{children}</h1>,
                    h2: ({children}) => <h2 style={{fontSize: '1.1rem', fontWeight: '600', margin: '6px 0', color: '#333'}}>{children}</h2>,
                    h3: ({children}) => <h3 style={{fontSize: '1rem', fontWeight: '600', margin: '4px 0', color: '#333'}}>{children}</h3>,
                    p: ({children}) => <p style={{margin: '4px 0', color: '#333'}}>{children}</p>,
                    ul: ({children}) => <ul style={{margin: '8px 0', paddingLeft: '20px', color: '#333'}}>{children}</ul>,
                    ol: ({children}) => <ol style={{margin: '8px 0', paddingLeft: '20px', color: '#333'}}>{children}</ol>,
                    li: ({children}) => <li style={{margin: '2px 0', color: '#333'}}>{children}</li>,
                    code: ({children, className}) => {
                      const isInline = !className
                      return isInline ? (
                        <code style={{
                          background: '#e9ecef',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.9em',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                          color: '#d63384'
                        }}>{children}</code>
                      ) : (
                        <code style={{
                          display: 'block',
                          background: '#f8f9fa',
                          padding: '12px',
                          borderRadius: '6px',
                          fontSize: '0.9em',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                          color: '#333',
                          border: '1px solid #e9ecef',
                          overflow: 'auto',
                          margin: '8px 0'
                        }}>{children}</code>
                      )
                    },
                    pre: ({children}) => <pre style={{margin: '8px 0', background: 'transparent'}}>{children}</pre>,
                    blockquote: ({children}) => (
                      <blockquote style={{
                        borderLeft: '4px solid #667eea',
                        paddingLeft: '12px',
                        margin: '8px 0',
                        fontStyle: 'italic',
                        color: '#555'
                      }}>{children}</blockquote>
                    ),
                    strong: ({children}) => <strong style={{fontWeight: '600', color: '#333'}}>{children}</strong>,
                    em: ({children}) => <em style={{fontStyle: 'italic', color: '#333'}}>{children}</em>,
                    a: ({children, href}) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#667eea',
                          textDecoration: 'underline'
                        }}
                      >{children}</a>
                    ),
                    table: ({children}) => (
                      <table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        margin: '8px 0',
                        border: '1px solid #e9ecef'
                      }}>{children}</table>
                    ),
                    th: ({children}) => (
                      <th style={{
                        border: '1px solid #e9ecef',
                        padding: '8px',
                        background: '#f8f9fa',
                        fontWeight: '600',
                        color: '#333'
                      }}>{children}</th>
                    ),
                    td: ({children}) => (
                      <td style={{
                        border: '1px solid #e9ecef',
                        padding: '8px',
                        color: '#333'
                      }}>{children}</td>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px'
          }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: '#f8f9fa',
                color: '#333',
                border: '1px solid #e9ecef',
                fontSize: '0.95rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #dee2e6',
                  borderTop: '2px solid #0070f3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flexGrow: 1 }}>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about your uploaded file...'
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '24px',
              outline: 'none',
              fontSize: '0.95rem',
              background: loading ? '#f8f9fa' : '#fff',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
              color: '#333'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>
        <button
          type='submit'
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '24px',
            background: loading || !input.trim() 
              ? '#dee2e6' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: loading || !input.trim() 
              ? 'none' 
              : '0 2px 8px rgba(102, 126, 234, 0.3)',
            minWidth: '80px'
          }}
          onMouseOver={(e) => {
            if (!loading && input.trim()) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseOut={(e) => {
            if (!loading && input.trim()) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'
            }
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Sending
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
