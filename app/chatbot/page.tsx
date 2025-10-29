'use client'
import Chat from '@/components/Chat'
import UploadForm from '@/components/UploadForm'
import React, { useState } from 'react'


export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Called when a file upload completes successfully
  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return
    setSessionId(data.sessionId)
    setFilePreview(data.text)
  }

  const reset = () => {
    setSessionId(null)
    setFilePreview(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Gemini Chatbot
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#666',
              fontSize: '1rem'
            }}>
              Upload documents and chat with AI
            </p>
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            background: '#f8f9fa',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid #e9ecef'
          }}>
            Supports PDF, PPTX, DOCX, TXT, Images (OCR)
          </div>
        </header>

        {!sessionId && (
          <section style={{ 
            border: '2px dashed #dee2e6', 
            padding: '32px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            background: '#f8f9fa',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>📄</div>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '8px',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#333'
              }}>
                Upload a file to get started
              </h2>
              <p style={{ 
                marginTop: 0, 
                color: '#666',
                fontSize: '1rem',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Drop a PDF, PPTX, DOCX, TXT or an image. Text will be extracted and used as context for the chatbot.
              </p>
            </div>
            <UploadForm onUploaded={handleUploaded} />
            <small style={{ 
              display: 'block', 
              marginTop: '16px', 
              color: '#888',
              fontSize: '0.875rem'
            }}>
              💡 Tip: Large files may be truncated; for long documents we recommend RAG/chunking
            </small>
          </section>
        )}

        {sessionId && (
          <section>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{
                background: '#e3f2fd',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #bbdefb'
              }}>
                <strong style={{ color: '#1976d2' }}>Session:</strong> 
                <code style={{ 
                  marginLeft: '8px',
                  background: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  {sessionId}
                </code>
              </div>
              <button 
                onClick={reset} 
                style={{ 
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
              >
                Reset session
              </button>
            </div>

            {filePreview && (
              <div
                style={{
                  borderLeft: '4px solid #28a745',
                  padding: '16px',
                  marginBottom: '20px',
                  background: '#f8fff9',
                  borderRadius: '0 8px 8px 0',
                  border: '1px solid #d4edda'
                }}
              >
                <strong style={{ color: '#155724' }}>Document excerpt (first 1k chars)</strong>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  marginTop: '12px',
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: '#333'
                }}>
                  {filePreview}
                </pre>
              </div>
            )}

            <Chat sessionId={sessionId} />
          </section>
        )}

        <footer style={{ 
          marginTop: '48px', 
          color: '#666', 
          fontSize: '14px',
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>Notes:</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>In-memory sessions — restart loses data. Use Redis for persistence.</li>
            <li>OCR on images uses tesseract.js; it can be slow for many images.</li>
            <li>I can add chunking + vector store (Milvus/Weaviate/Redis) for long docs.</li>
          </ul>
        </footer>
      </main>
    </div>
  )
}
