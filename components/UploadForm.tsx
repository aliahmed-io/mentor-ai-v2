"use client";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadFormProps {
  onUploaded: (data: { sessionId: string; text: string }) => void;
}

export default function UploadForm({ onUploaded }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;

    setLoading(true);
    setError(null);

    const fd = new FormData();
    files.forEach((f) => fd.append("file", f));

    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onUploaded?.(data);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            setFiles(Array.from(e.target.files));
          }
        }}
        accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
      />

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      <Button
        type="submit"
        variant="outline"
        disabled={loading || !files.length}
        className="border"
      >
        {loading ? "Uploading..." : `Upload ${files.length > 0 ? files.length + " File(s)" : "Files"}`}
      </Button>
    </form>
  );
}
