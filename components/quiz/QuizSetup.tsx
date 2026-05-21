"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { MentorLogoShort } from "@/components/globals/MentorLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuizSetup as QuizSetupType } from "@/types/quiz";

interface QuizSetupProps {
  onSetupComplete: (setup: QuizSetupType) => void;
}

const difficultyOptions = [
  {
    value: "easy",
    label: "Easy",
    description: "Basic concepts and fundamentals",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Intermediate level questions",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Advanced and challenging topics",
  },
] as const;

const topicSuggestions = [
  "JavaScript",
  "React",
  "Python",
  "TypeScript",
  "Node.js",
];

export default function QuizSetup({ onSetupComplete }: QuizSetupProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [studyMaterial, setStudyMaterial] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For plain text-like files, read on client; otherwise, send to server to extract
    const lower = file.name.toLowerCase();
    const isPlain = lower.endsWith(".txt") || lower.endsWith(".md");

    if (isPlain) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || "";
        setFileContent(content);
        setStudyMaterial(content);
      };
      reader.readAsText(file);
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/quiz/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract text");
      const content: string = data.text || "";
      setFileContent(content);
      setStudyMaterial(content);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const inferTopicFromText = (text: string): string => {
    const cleaned = (text || "").replace(/\r/g, "");
    const firstNonEmptyLine =
      cleaned
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 8) || cleaned.slice(0, 60);
    const words = firstNonEmptyLine.split(/\s+/).slice(0, 8).join(" ");
    return words || "Uploaded Material";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow starting if either topic or study material exists
    if (!topic.trim() && !studyMaterial.trim()) return;

    const setup: QuizSetupType = {
      topic: topic.trim() || inferTopicFromText(studyMaterial),
      difficulty,
      questionCount,
      studyMaterial: studyMaterial.trim() || undefined,
    };

    onSetupComplete(setup);
  };

  return (
    <div className="p-1 md:p-1">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="premium-card bg-[var(--card)] p-8 relative overflow-hidden"
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)] opacity-[0.02] rounded-full blur-xl pointer-events-none" />

        <div className="text-center space-y-3 pb-6 border-b border-[var(--border)]">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20"
          >
            <MentorLogoShort className="size-7 text-[var(--primary)]" />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold text-[var(--foreground)]">
            Create AI Quiz
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Configure learning milestones or translate uploaded study guides
            into an interactive examination.
          </p>
        </div>

        <div className="space-y-6 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Selection */}
            <div className="space-y-2.5">
              <Label
                htmlFor="topic"
                className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
                Quiz Topic
              </Label>
              <Input
                id="topic"
                placeholder="e.g., JavaScript, React Fundamentals, Cellular Biology..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-sm py-5 rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background transition-all duration-300"
              />
              <p className="text-[10px] text-[var(--muted-foreground)] italic">
                Optional if study material or a file is provided below.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {topicSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTopic(suggestion)}
                    className="text-[10px] font-semibold bg-[var(--background)] hover:bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] rounded-full px-3 py-1 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Difficulty Level
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {difficultyOptions.map((o) => {
                  const active = difficulty === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setDifficulty(o.value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm ring-1 ring-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--foreground)]">
                        {o.label}
                      </div>
                      <div className="text-[9px] text-[var(--muted-foreground)] mt-1 font-serif italic leading-tight">
                        {o.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="questionCount"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                >
                  Number of Questions
                </Label>
                <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full">
                  {questionCount}
                </span>
              </div>
              <div className="space-y-2 px-0.5">
                <input
                  id="questionCount"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(parseInt(e.target.value, 10))
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--muted)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer accent-[var(--primary)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] font-medium">
                  <span>5</span>
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>40</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            {/* Study Material */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                Study Material (Optional)
              </Label>
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste references, text snippets, or lecture notes here..."
                  value={studyMaterial}
                  onChange={(e) => setStudyMaterial(e.target.value)}
                  className="min-h-[100px] text-sm rounded-xl border-[var(--border)] bg-[var(--background)] focus:bg-background resize-none"
                />

                {/* Custom File Upload Drag Zone */}
                <div className="border border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-5 bg-[var(--background)] transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer relative group">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.md,.pdf,.pptx,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <Upload className="w-6 h-6 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] mb-1.5 transition-colors duration-300" />
                  <div className="text-xs font-bold text-[var(--foreground)]">
                    Drag & drop or select study guide
                  </div>
                  <div className="text-[9px] text-[var(--muted-foreground)] mt-0.5">
                    Supports PDF, PPTX, DOCX, TXT, MD
                  </div>

                  {isUploading && (
                    <div className="mt-2 text-xs text-[var(--primary)] font-mono animate-pulse">
                      Extracting contents...
                    </div>
                  )}
                  {!isUploading && fileContent && (
                    <div className="mt-2 text-xs text-[var(--primary)] font-semibold">
                      ✅ Document parsed successfully
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-6 rounded-full text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 shadow-md transition-all duration-300 hover:scale-101"
                disabled={!topic.trim() && !studyMaterial.trim()}
              >
                Assemble & Start Quiz
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
