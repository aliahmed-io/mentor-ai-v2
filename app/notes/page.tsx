"use client";

import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeBackground } from "@/components/presentation/theme/ThemeBackground";
import UploadForm from "@/components/UploadForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function NotesGeneratorPage() {
  const router = useRouter();

  const [documentText, setDocumentText] = useState("");
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [depth, setDepth] = useState<"short" | "normal" | "detailed">("normal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isTexFallback, setIsTexFallback] = useState(false);

  const handleUploaded = (data: { sessionId: string; text: string }) => {
    if (!data) return;
    setDocumentText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    toast.success("Document loaded successfully!");
  };

  const handleGenerate = async () => {
    if (!documentText.trim()) {
      toast.error("Please upload a document or paste some text first.");
      return;
    }

    try {
      setIsGenerating(true);
      setPdfUrl(null);
      setIsTexFallback(false);

      // Phase 1: Generation
      setStatus(`Synthesizing ${depth === "short" ? "concise" : depth === "detailed" ? "comprehensive" : "structured"} AI Notes via Gemini 2.5 Flash...`);
      const genRes = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentText,
          title: topic || "AI Notes",
          instructions: instructions,
          depth,
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        throw new Error(errData.error || "Failed to generate LaTeX");
      }

      const { latex } = await genRes.json();

      // Phase 2: Compilation
      setStatus("Compiling LaTeX into PDF...");
      const compRes = await fetch("/api/notes/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex }),
      });

      if (!compRes.ok) {
        if (compRes.status === 503) {
          // Provide .tex file as fallback
          const blob = new Blob([latex], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setIsTexFallback(true);
          toast.warning("Compilation server is down. We've saved your notes as a .tex file instead. You can compile it locally or on Overleaf.");
          setStatus("");
          return;
        }

        const errData = await compRes.json();
        throw new Error(errData.details || errData.error || "Failed to compile PDF");
      }

      // Read PDF buffer
      const blob = await compRes.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast.success("PDF generated successfully!");
      setStatus("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during generation.");
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ThemeBackground className="flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 rounded-full bg-background/60 hover:bg-background/80 transition-all shadow-sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                LaTeX Engine
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20 animate-pulse">
                Gemini 2.5 Flash
              </span>
            </div>
            <h1 className="text-sm font-bold truncate">
              Academic Notes Generator
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto gap-8">
        {/* Title/Topic Input */}
        <div className="w-full space-y-2 text-center mb-4">
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            Transform Documents into Academic Notes
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload your syllabus, messy notes, or slides to instantly generate
            beautifully formatted LaTeX PDFs.
          </p>
        </div>

        <div className="w-full grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md p-6 space-y-6 flex flex-col shadow-xl">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <FileText className="h-5 w-5 text-primary" />
              <p className="text-base font-bold uppercase tracking-wider text-foreground">
                Knowledge Source
              </p>
            </div>

            <div className="space-y-3 flex-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Topic Title (Optional)
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/55 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/45 transition-all"
                placeholder="e.g., CS3178 GRC Midterm"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-3 flex-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Specific Instructions (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-border/50 bg-background/55 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/45 transition-all resize-y"
                placeholder="e.g., don't use icons, make it pink and girly, focus on definitions..."
                disabled={isGenerating}
              />
            </div>

            {/* Depth / Length Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Summary Depth
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "short",    label: "Short",    sub: "Key ideas only" },
                  { value: "normal",   label: "Normal",   sub: "Full coverage" },
                  { value: "detailed", label: "Detailed",  sub: "Every detail" },
                ] as const).map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setDepth(value)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                      depth === value
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] mt-0.5 opacity-70">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Upload Materials
              </label>
              <div
                className={cn(
                  "rounded-xl border border-dashed border-border/50 p-3 bg-background/20 transition-all duration-200",
                  isGenerating && "opacity-50 pointer-events-none",
                )}
              >
                <UploadForm onUploaded={handleUploaded} />
              </div>
            </div>

            {documentText && (
              <div className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-2 rounded-md border border-emerald-500/20 text-center">
                ✓ Document text successfully extracted
              </div>
            )}
          </div>

          {/* Action / Output Section */}
          <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md p-6 space-y-6 flex flex-col justify-center items-center shadow-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <BookOpen className="h-12 w-12 text-primary/40 mb-2" />
            <h3 className="text-lg font-bold">Ready to Compile</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Our AI will analyze your documents, extract the core concepts, and
              build a highly visual PDF study guide using academic LaTeX
              rendering.
            </p>
            <div className="h-4" /> {/* Spacer */}
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Spinner className="h-8 w-8 text-primary" />
                <div className="rounded-xl border border-border/20 bg-slate-950 p-3 w-full text-left font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-3 w-3 text-emerald-500" />
                    <span className="uppercase tracking-widest text-emerald-500">
                      Terminal Process
                    </span>
                  </div>
                  <div className="animate-pulse">{status}</div>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  {isTexFallback ? "LaTeX Generation Complete!" : "Compilation Complete!"}
                </div>
                <a
                  href={pdfUrl}
                  download={`${topic || "academic-notes"}${isTexFallback ? ".tex" : ".pdf"}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full rounded-full bg-gradient-to-r from-primary to-primary/80 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isTexFallback ? "Download .tex File" : "Download PDF"}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPdfUrl(null);
                    setDocumentText("");
                    setTopic("");
                    setInstructions("");
                    setDepth("normal");
                    setIsTexFallback(false);
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Create Another
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!documentText}
                size="lg"
                className="w-full rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Visual PDF
              </Button>
            )}
          </div>
        </div>
      </main>
    </ThemeBackground>
  );
}
