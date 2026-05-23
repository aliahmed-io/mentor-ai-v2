import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresentationState } from "@/states/presentation-state";
import { OutlineItem } from "./OutlineItem";

interface OutlineItemType {
  id: string;
  title: string;
}

export function OutlineList() {
  const {
    outline: initialItems,
    setOutline,
    numSlides,
    webSearchEnabled,
    outlineThinking,
    slideOverrides,
    setSlideOverride,
    isGeneratingOutline,
  } = usePresentationState();

  const [items, setItems] = useState<OutlineItemType[]>(
    initialItems.map((title, index) => ({
      id: (index + 1).toString(),
      title,
    })),
  );

  useEffect(() => {
    setItems(
      initialItems.map((title, index) => ({
        id: (index + 1).toString(),
        title,
      })),
    );
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((prevItems) => {
          const oldIndex = prevItems.findIndex((item) => item.id === active.id);
          const newIndex = prevItems.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(prevItems, oldIndex, newIndex);
          setOutline(newItems.map((item) => item.title));
          return newItems;
        });
      }
    },
    [setOutline],
  );

  const handleTitleChange = useCallback(
    (id: string, newTitle: string) => {
      setItems((prevItems) => {
        const itemToChange = prevItems.find((item) => item.id === id);
        if (itemToChange && slideOverrides[itemToChange.title]) {
          // Migrate the override to the new title key
          const existingOverride = slideOverrides[itemToChange.title];
          setSlideOverride(newTitle, existingOverride);
          // Optional: we don't strictly need to delete the old key, but we could
        }

        const newItems = prevItems.map((item) =>
          item.id === id ? { ...item, title: newTitle } : item,
        );
        setOutline(newItems.map((item) => item.title));
        return newItems;
      });
    },
    [setOutline, slideOverrides, setSlideOverride],
  );

  const handleAddCard = useCallback(() => {
    setItems((prevItems) => {
      const newId =
        prevItems.length > 0
          ? (
              Math.max(...prevItems.map((item) => parseInt(item.id, 10))) + 1
            ).toString()
          : "1";
      const newItems = [...prevItems, { id: newId, title: "New Card" }];
      setOutline(newItems.map((item) => item.title));
      return newItems;
    });
  }, [setOutline]);

  const handleDeleteCard = useCallback(
    (id: string) => {
      setItems((prevItems) => {
        const newItems = prevItems.filter((item) => item.id !== id);
        setOutline(newItems.map((item) => item.title));
        return newItems;
      });
    },
    [setOutline],
  );

  const content = useMemo(() => {
    const totalSlides = numSlides;
    const loadedCount = items.length;
    const remainingCount = Math.max(0, totalSlides - loadedCount);

    const showSkeletonPlaceholders =
      webSearchEnabled && items.length === 0 && !isGeneratingOutline;
    const showLoadingSkeletons =
      isGeneratingOutline && items.length === 0 && remainingCount > 0;
    const showEmptyState =
      !isGeneratingOutline && items.length === 0 && !showSkeletonPlaceholders;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <OutlineItem
                key={item.id}
                id={item.id}
                index={index + 1}
                title={item.title}
                onTitleChange={handleTitleChange}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        </SortableContext>
        {showSkeletonPlaceholders && <Skeleton className="h-96 w-full" />}

        {showLoadingSkeletons && (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
            {Array.from({ length: Math.min(remainingCount, 6) }).map(
              (_, index) => (
                <Skeleton key={`loading-${index}`} className="h-32 w-full" />
              ),
            )}
          </div>
        )}

        {showEmptyState && (
          <p className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No outline yet. Click &quot;Regenerate Outline&quot; above to
            generate slide topics from your prompt.
          </p>
        )}
      </DndContext>
    );
  }, [
    items,
    numSlides,
    isGeneratingOutline,
    webSearchEnabled,
    sensors,
    handleDragEnd,
    handleTitleChange,
    handleDeleteCard,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-foreground">Outline</h2>
        {isGeneratingOutline && (
          <span className="animate-pulse text-xs text-muted-foreground">
            Generating outline...
          </span>
        )}
        {webSearchEnabled && items.length === 0 && !isGeneratingOutline && (
          <span className="text-xs text-muted-foreground">
            Ready to generate
          </span>
        )}
      </div>

      {content}

      <button
        onClick={handleAddCard}
        disabled={isGeneratingOutline}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-muted/50 py-3 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <Plus size={20} />
        Add card
      </button>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{items.length} cards total</span>
        <span>
          {items.reduce((acc, item) => acc + item.title.length, 0)}/20000
        </span>
      </div>
    </div>
  );
}
