"use client";
import {
  Brain,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecentFlashcardsPanel } from "@/components/recent/RecentFlashcardsPanel";
import UploadForm from "@/components/UploadForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  tags?: string[];
};

export default function FlashcardPage() {
  const router = useRouter();
  const [material, setMaterial] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return;
    setMaterial((prev) => (prev ? `${prev}\n\n` : "") + data.text);
  };

  const generate = async () => {
    if (!material.trim()) {
      setError("Please provide study material (paste text or upload a file).");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: material.trim(),
          topic: topic.trim() || undefined,
          count,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to generate flashcards");
      }
      const data = await res.json();
      const id: string | undefined = data?.id;
      if (id) {
        router.push(`/flashcard/${id}`);
      } else {
        throw new Error("Missing session id in response");
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick preset sizes
  const presets = [8, 12, 20, 32];

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-1 py-4">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-foreground/90 mb-3 select-none">
            <Brain className="size-3 text-primary" /> Active Spaced Recall
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Flashcard Generator
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 font-light max-w-2xl leading-relaxed">
            Harness active recall instantly. Paste your lectures or drop
            academic papers to create optimized study decks in seconds.
          </p>
        </div>
      </header>

      {/* Primary Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Card Title & Input */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" /> Study Notes or
                  Raw Material
                </label>
                <Textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Paste your lecture notes, chapter summaries, or text clippings here..."
                  className="min-h-[200px] rounded-2xl border-border bg-background/20 p-4 transition-all duration-300 text-sm leading-relaxed"
                />
              </div>

              {/* Settings: Upload, Topic & Deck Size */}
              <div className="flex flex-col gap-6">
                {/* Upload File */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Upload className="size-3.5 text-primary" /> Upload Academic
                    File
                  </label>
                  <div className="rounded-[1.5rem] border border-dashed border-border p-4 bg-background/10 hover:bg-background/30 transition-all duration-200">
                    <UploadForm onUploaded={handleUploaded} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-light mt-2 px-1">
                    Securely parses PDF, DOCX, PPTX, TXT, or images. Text
                    contents will be appended to your editor above.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Optional Topic */}
                  <div className="space-y-3 flex-1">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <HelpCircle className="size-3.5 text-primary" /> Optional
                      Deck Topic
                    </label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Biology - Mitosis Stages"
                      className="rounded-xl border-border bg-background/20 px-4 py-2.5 transition-all duration-300 text-sm focus:bg-background"
                    />
                  </div>

                  {/* Deck Size Goal */}
                  <div className="space-y-3 flex-1">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Layers className="size-3.5 text-primary" /> Deck Size
                      Goal
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 bg-background/40 p-1 border border-border rounded-xl">
                        {presets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCount(p)}
                            className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                              count === p
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "hover:bg-secondary/40 text-muted-foreground"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="w-20 shrink-0 relative">
                        <Input
                          type="number"
                          min={4}
                          max={50}
                          value={count}
                          onChange={(e) =>
                            setCount(
                              Math.max(
                                4,
                                Math.min(50, Number(e.target.value) || 0),
                              ),
                            )
                          }
                          className="w-full rounded-xl border-border bg-background/20 text-center font-bold text-sm pr-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={generate}
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-full py-6 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Forging Study Deck...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-2xl p-4 flex items-center gap-3 mt-4">
                  <span className="size-2 rounded-full bg-destructive animate-pulse shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right configuration panel: Sanctuary Decks History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-card overflow-hidden p-6 md:p-8 space-y-5">
            <div className="mb-2">
              <h2 className="text-lg font-serif font-extrabold text-foreground">
                Sanctuary Decks
              </h2>
              <p className="text-[11px] text-muted-foreground font-light mt-1">
                Jump back into active recall instantly.
              </p>
            </div>
            <RecentFlashcardsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
