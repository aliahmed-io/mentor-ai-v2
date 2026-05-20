"use client";
import {
  FileText,
  GraduationCap,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import { RecentChatDocsPanel } from "@/components/recent/RecentChatDocsPanel";
import UploadForm from "@/components/UploadForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return;
    setSessionId(data.sessionId);
    setFilePreview(data.text);
    try {
      localStorage.setItem("chat_session_id", data.sessionId);
    } catch {}
  };

  const reset = () => {
    setSessionId(null);
    setFilePreview(null);
    try {
      localStorage.removeItem("chat_session_id");
    } catch {}
  };

  useEffect(() => {
    try {
      const sid = localStorage.getItem("chat_session_id");
      if (sid) setSessionId(sid);
    } catch {}
  }, []);

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-6">
      {/* Editorial Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <GraduationCap className="size-3.5" />
            AI Study Partner
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">
            Tutor Chatbot
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload custom lecture notes, slide decks, or readings to instantly
            chat with your personal AI mentor.
          </p>
        </div>
        <div className="rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          Supports:{" "}
          <span className="text-foreground font-semibold">
            PDF, PPTX, DOCX, TXT
          </span>{" "}
          & Images
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area */}
        <div className="lg:col-span-8 space-y-6">
          {!sessionId && (
            <Card className="border border-border/80 rounded-[2rem] shadow-xl shadow-primary/5 bg-card overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="size-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-serif text-foreground">
                    Upload your document to begin
                  </h2>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
                    Drop a study document or capture an image. Our intelligent
                    model will extract and analyze its contents to guide your
                    study block.
                  </p>
                </div>

                <div className="mx-auto max-w-xl p-2 bg-background/50 rounded-3xl border border-border/60">
                  <UploadForm onUploaded={handleUploaded} />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary animate-pulse" />
                  <span>
                    Pro-tip: Keep documents focused under 20 pages for the most
                    concise, accurate sessions!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {sessionId && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Active Session:
                  </span>
                  <code className="rounded bg-muted px-2.5 py-1 font-mono text-foreground border border-border/40">
                    {sessionId}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="gap-1.5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                >
                  <RefreshCw className="size-3.5" />
                  Reset Session
                </Button>
              </div>

              {filePreview && (
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Document Excerpt (1st 1,000 characters)
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-y-auto rounded-xl border border-border/40 bg-muted/30 p-3 text-xs leading-relaxed font-mono text-muted-foreground scrollbar-thin">
                    {filePreview}
                  </pre>
                </div>
              )}

              <div className="shadow-lg shadow-primary/5 rounded-[2rem] overflow-hidden border border-border/60">
                <Chat sessionId={sessionId} />
              </div>
            </section>
          )}

          {/* Help & Notes Footer Widget */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HelpCircle className="size-4 text-primary" />
              <span>Workspace Notes & Best Practices</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <li className="space-y-1">
                <span className="font-semibold text-foreground">
                  Adaptive OCR
                </span>
                <p>
                  Images undergo seamless client-side text extraction using
                  premium deep-learning neural filters.
                </p>
              </li>
              <li className="space-y-1">
                <span className="font-semibold text-foreground">
                  Live Context Buffer
                </span>
                <p>
                  The AI dynamically maps conversation memories directly onto
                  active document contexts.
                </p>
              </li>
              <li className="space-y-1">
                <span className="font-semibold text-foreground">
                  Save as Study Notes
                </span>
                <p>
                  Click "Save conversation" inside active threads to instantly
                  serialize chat logs into your document library.
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Panel for Quick History Access */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-card overflow-hidden p-6 md:p-8 space-y-5">
            <div className="mb-2">
              <h2 className="text-lg font-serif font-extrabold text-foreground">
                Recent Sessions
              </h2>
              <p className="text-[11px] text-muted-foreground font-light mt-1">
                Jump back into your active tutor chats.
              </p>
            </div>
            <RecentChatDocsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
