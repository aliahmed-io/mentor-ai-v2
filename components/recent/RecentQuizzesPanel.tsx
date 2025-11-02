"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ClipboardList, Clock, Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type QuizSet = { id: string; topic: string; difficulty: string; questionCount: number; createdAt: string };

export function RecentQuizzesPanel() {
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/quiz/recent?limit=25", { cache: "no-store" });
      if (!r.ok) return setSets([]);
      const d = await r.json();
      setSets(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const rename = async (id: string, currentTitle: string) => {
    const topic = prompt("Enter new title", currentTitle || "");
    if (!topic) return;
    await fetch(`/api/quiz/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
    await load();
  };

  const del = async (id: string) => {
    await fetch(`/api/quiz/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recent Quizzes</h2>
          </div>
          <Button variant="ghost" disabled className="gap-2 text-primary hover:text-primary/80">
            View all
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="group overflow-hidden transition-all hover:shadow-lg">
              <div className="relative aspect-video">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (sets.length === 0) return null;

  return (
    <aside className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recent Quizzes</h2>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-primary hover:bg-primary/5 hover:text-primary">
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[640px] sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>All Quizzes</SheetTitle>
            </SheetHeader>
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sets.map((q) => (
                  <Card key={q.id} className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    {(q as any).thumbnailUrl ? (
                      <Link href={`/quiz/${q.id}`} className="relative aspect-video">
                        <Image src={(q as any).thumbnailUrl} alt={q.topic || "Quiz"} fill className="object-cover" />
                      </Link>
                    ) : (
                      <Link href={`/quiz/${q.id}`} className="relative aspect-video bg-muted">
                        <div className="flex h-full w-full items-center justify-center">
                          <ClipboardList className="h-10 w-10 text-primary/60" />
                        </div>
                      </Link>
                    )}
                    <CardContent className="p-0">
                      <Link href={`/quiz/${q.id}`} className="flex flex-col space-y-2 p-4">
                        <h3 className="line-clamp-1 text-lg font-semibold text-foreground">{q.topic || "Untitled Quiz"}</h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3.5 w-3.5" />
                          {formatDate(q.createdAt)}
                        </div>
                      </Link>
                    </CardContent>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => rename(q.id, q.topic)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(q.id); setDeleteOpen(true); }} className="cursor-pointer text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sets.slice(0, 3).map((q) => (
          <Card key={q.id} className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            { (q as any).thumbnailUrl ? (
              <Link href={`/quiz/${q.id}`} className="relative aspect-video">
                <Image src={(q as any).thumbnailUrl} alt={q.topic || "Quiz"} fill className="object-cover" />
              </Link>
            ) : (
              <Link href={`/quiz/${q.id}`} className="relative aspect-video bg-muted">
                <div className="flex h-full w-full items-center justify-center">
                  <ClipboardList className="h-10 w-10 text-primary/60" />
                </div>
              </Link>
            )}
            <CardContent className="p-0">
              <Link href={`/quiz/${q.id}`} className="flex flex-col space-y-2 p-4">
                <h3 className="line-clamp-1 text-lg font-semibold text-foreground">{q.topic || "Untitled Quiz"}</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {formatDate(q.createdAt)}
                </div>
              </Link>
            </CardContent>
            <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => rename(q.id, q.topic)} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedId(q.id); setDeleteOpen(true); }} className="cursor-pointer text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {deleteOpen && (
        <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
          <SheetContent side="right" className="w-[420px] sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Delete quiz?</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => { if (selectedId) await del(selectedId); setDeleteOpen(false); }}>Delete</Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </aside>
  );
}


