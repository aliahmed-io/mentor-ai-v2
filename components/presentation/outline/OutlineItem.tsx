import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutTemplate, Send, Sparkles, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import ProseMirrorEditor from "@/components/prose-mirror/ProseMirrorEditor";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

interface OutlineItemProps {
  id: string;
  index: number;
  title: string;
  onTitleChange: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

// Wrap the component with memo to prevent unnecessary re-renders
export const OutlineItem = memo(function OutlineItem({
  id,
  index,
  title,
  onTitleChange,
  onDelete,
}: OutlineItemProps) {
  // Always editable, no need for isEditing state
  const [editedTitle, setEditedTitle] = useState(title);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteInput, setRewriteInput] = useState("");
  const { slideOverrides, setSlideOverride } = usePresentationState();
  const [isSavingRewrite, setIsSavingRewrite] = useState(false);

  const override = slideOverrides[title] || {};

  const TEMPLATES = [
    { id: "", label: "Auto (Let AI decide)" },
    { id: "title-hero", label: "Title Hero" },
    { id: "img-split-left", label: "Image Left" },
    { id: "img-split-right", label: "Image Right" },
    { id: "process-arrows", label: "Process/Steps" },
    { id: "bento-grid", label: "Bento Grid" },
    { id: "stat-grid", label: "Stats/Numbers" },
    { id: "compare-vs", label: "Comparison (VS)" },
  ];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Update editedTitle when title prop changes
  useEffect(() => {
    setTimeout(() => {
      setEditedTitle(title);
    }, 0);
  }, [title]);

  const handleProseMirrorChange = (newContent: string) => {
    setEditedTitle(newContent);
  };

  const handleProseMirrorBlur = () => {
    if (editedTitle.trim() !== title) {
      onTitleChange(id, editedTitle);
    }
  };

  const handleRewriteSubmit = async () => {
    if (!rewriteInput.trim()) {
      setIsRewriting(false);
      return;
    }
    setIsSavingRewrite(true);
    try {
      const res = await fetch("/api/presentation/rewrite-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: title,
          instruction: rewriteInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditedTitle(data.rewrittenText);
        onTitleChange(id, data.rewrittenText);
      }
    } catch (e) {
      console.error("Rewrite failed", e);
    } finally {
      setIsSavingRewrite(false);
      setIsRewriting(false);
      setRewriteInput("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md p-5 shadow-sm transition-all hover:shadow-md relative",
        isDragging && "opacity-50 ring-2 ring-primary/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move text-muted-foreground/50 hover:text-foreground transition-colors p-1 -ml-1 rounded"
          >
            <GripVertical size={16} />
          </div>
          <span className="text-sm font-bold text-primary">{index}.</span>
        </div>
        <button
          onClick={() => onDelete(id)}
          aria-label="Delete card"
          title="Delete card"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 w-full pl-1">
        {isSavingRewrite ? (
          <div className="flex items-center gap-2 p-4 text-sm text-primary animate-pulse">
            <Sparkles className="h-4 w-4" /> Rewriting slide logic...
          </div>
        ) : (
          <ProseMirrorEditor
            content={editedTitle}
            onChange={handleProseMirrorChange}
            isEditing={true}
            onBlur={handleProseMirrorBlur}
            className="prose-headings:m-0 prose-headings:text-base prose-headings:font-bold prose-p:text-sm prose-p:m-0 prose-ol:text-sm prose-ol:m-0 prose-ul:text-sm prose-ul:m-0 prose-li:m-0 outline-none w-full max-w-full overflow-hidden"
            showFloatingToolbar={false}
          />
        )}
      </div>

      {isRewriting && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
          <input
            type="text"
            autoFocus
            value={rewriteInput}
            onChange={(e) => setRewriteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRewriteSubmit();
              if (e.key === "Escape") setIsRewriting(false);
            }}
            placeholder="E.g., Make it funnier, focus on Q3 stats..."
            className="flex-1 bg-background/50 border border-border/50 rounded text-xs px-2 py-1 outline-none focus:border-primary"
          />
          <button
            onClick={handleRewriteSubmit}
            className="p-1 hover:text-primary transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Footer controls: Template Selection and AI Rewrite */}
      <div className="flex items-center justify-between border-t border-border/20 pt-3 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/30 px-2 py-1 rounded-md border border-border/40">
          <LayoutTemplate size={12} className="text-primary" />
          <select
            className="bg-transparent outline-none cursor-pointer text-xs"
            value={override.templateId || ""}
            onChange={(e) =>
              setSlideOverride(title, {
                ...override,
                templateId: e.target.value,
              })
            }
          >
            {TEMPLATES.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-background text-foreground"
              >
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsRewriting(!isRewriting)}
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors",
            isRewriting
              ? "bg-primary/20 text-primary"
              : "hover:bg-primary/10 hover:text-primary text-muted-foreground",
          )}
        >
          <Sparkles size={12} />
          {isRewriting ? "Cancel" : "AI Rewrite"}
        </button>
      </div>
    </div>
  );
});

// Add a display name for debugging purposes
OutlineItem.displayName = "OutlineItem";
