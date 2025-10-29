'use client'
import React, { useState } from 'react'

interface UploadFormProps {
  onUploaded: (data: { sessionId: string; text: string }) => void
}

export default function UploadForm({ onUploaded }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    
    setLoading(true)
    setError(null)
    
    const fd = new FormData()
    fd.append('file', file)

    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await r.json()
      
      if (!r.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      onUploaded && onUploaded(data)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100%'
          }}
        />
      </div>
      
      {error && (
        <div style={{ color: '#d32f2f', fontSize: '14px' }}>
          Error: {error}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={loading || !file}
        style={{
          padding: '10px 16px',
          border: 'none',
          borderRadius: '6px',
          background: loading || !file ? '#ccc' : '#0070f3',
          color: '#fff',
          cursor: loading || !file ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {loading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  )
}