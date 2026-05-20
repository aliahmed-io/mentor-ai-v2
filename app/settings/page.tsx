"use client";

import { Eye, EyeOff, Key, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);

  useEffect(() => {
    // Read from cookies
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      if (match) return match[2];
      return "";
    };
    setGeminiKey(getCookie("gemini_api_key") || "");
    setOpenaiKey(getCookie("openai_api_key") || "");
  }, []);

  const saveKeys = () => {
    // Save to cookies with 365 days expiry
    const maxAge = 60 * 60 * 24 * 365;
    if (geminiKey.trim()) {
      document.cookie = `gemini_api_key=${geminiKey.trim()}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      document.cookie = "gemini_api_key=; path=/; max-age=0;";
    }

    if (openaiKey.trim()) {
      document.cookie = `openai_api_key=${openaiKey.trim()}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      document.cookie = "openai_api_key=; path=/; max-age=0;";
    }

    toast.success("API Keys saved successfully");
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 py-6">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-foreground/90 mb-3 select-none">
            <Key className="size-3 text-primary" /> Preferences
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 font-light max-w-2xl leading-relaxed">
            Configure your AI models and personal workspace preferences.
          </p>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-serif font-extrabold text-foreground">
                  API Keys
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide your own API keys to bypass default platform limits.
                  These are stored locally on your device in cookies and sent
                  securely to our servers during generation.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showGemini ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pr-10 rounded-xl bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showGemini ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Required for Quizzes, Flashcards, and Presentations.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showOpenai ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pr-10 rounded-xl bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenai(!showOpenai)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showOpenai ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Required for the Tutor Chatbot.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={saveKeys}
                  className="gap-2 rounded-full px-8 py-6"
                >
                  <Save className="size-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <h2 className="text-lg font-serif font-extrabold text-foreground">
                    Privacy Notice
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-light mt-1">
                    How we handle your keys
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Your API keys are stored securely as HTTP cookies on your
                  device.
                </p>
                <p>
                  When you initiate an AI generation, these keys are passed to
                  our server and used strictly for that specific request. They
                  are never saved to our database.
                </p>
                <p>
                  You can clear your keys at any time by emptying the fields and
                  clicking Save.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
