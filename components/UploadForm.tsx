'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
      />

      {error && (
        <div className="text-sm text-red-600">Error: {error}</div>
      )}

      <Button type="submit" variant="outline" disabled={loading || !file} className="border">
        {loading ? 'Uploading...' : 'Upload File'}
      </Button>
    </form>
  )
}