"use client";

import { useChat } from "@ai-sdk/react";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { generateImageAction } from "@/app/_actions/image/generate";
import { getImageFromUnsplash } from "@/app/_actions/image/unsplash";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import { bakeThemeIntoSlides } from "@/lib/presentation/apply-theme-to-slides";
import {
  getLayoutForSlide,
  getRequiredComponent,
} from "@/lib/presentation/layout-recipes";
import {
  getChatMessageText,
  parseOutlineFromMessageText,
} from "@/lib/presentation/outline-parser";
import { extractThinking } from "@/lib/thinking-extractor";
import { usePresentationState } from "@/states/presentation-state";
import type { PlateSlide } from "../utils/parser";
import { SlideParser } from "../utils/parser";

export function PresentationGenerationManager() {
  const {
    numSlides,
    language,
    textModel,
    presentationInput,
    shouldStartOutlineGeneration,
    shouldStartPresentationGeneration,
    webSearchEnabled,
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    setShouldStartPresentationGeneration,
    resetGeneration,
    resetForNewGeneration,
    setOutline,
    setSearchResults,
    setSlides,
    setOutlineThinking,
    setIsGeneratingPresentation,
    setCurrentPresentation,
    currentPresentationId,
    imageModel,
    imageSource,
    rootImageGeneration,
    startRootImageGeneration,
    completeRootImageGeneration,
    failRootImageGeneration,
    isGeneratingPresentation,
    isGeneratingOutline,
    slides,
    outline,
    imageQueue,
    pushImageToQueue,
    popImageFromQueue,
  } = usePresentationState();

  const slideGenerationAbortRef = useRef<AbortController | null>(null);
  const outlineRafIdRef = useRef<number | null>(null);
  const outlineBufferRef = useRef<string[] | null>(null);
  const searchResultsBufferRef = useRef<Array<{
    query: string;
    results: unknown[];
  }> | null>(null);
  // Track the last processed messages length to avoid unnecessary updates
  const lastProcessedMessagesLength = useRef<number>(0);
  // Track if title has already been extracted to avoid unnecessary processing
  const titleExtractedRef = useRef<boolean>(false);

  // UDG Ref Trackers for preventing duplicate streaming trigger loops
  const outlineGenerationStartedRef = useRef<boolean>(false);
  const presentationGenerationStartedRef = useRef<boolean>(false);

  // UDG Ref Trackers for the Sequential Queue Worker
  const isQueueWorkerBusy = useRef<boolean>(false);
  const queuedSlideIds = useRef<Set<string>>(new Set());

  const mergeRootImagesIntoSlides = useCallback(
    (allSlides: PlateSlide[]): PlateSlide[] =>
      allSlides.map((slide) => {
        const gen = rootImageGeneration[slide.id];
        if (gen?.status === "success" && gen.url && slide.rootImage) {
          return {
            ...slide,
            rootImage: { ...slide.rootImage, url: gen.url },
          };
        }
        return slide;
      }),
    [rootImageGeneration],
  );

  const applyOutlineFromText = (rawText: string): void => {
    const thinkingExtract = extractThinking(rawText);
    if (thinkingExtract.hasThinking) {
      setOutlineThinking(thinkingExtract.thinking);
    }

    const textForParse = thinkingExtract.hasThinking
      ? thinkingExtract.content
      : rawText;

    const { title, outlineItems } = parseOutlineFromMessageText(textForParse);

    if (title && !titleExtractedRef.current) {
      setCurrentPresentation(currentPresentationId, title);
      titleExtractedRef.current = true;
    }

    if (outlineItems.length > 0) {
      outlineBufferRef.current = outlineItems;
    }
  };

  // Function to process messages and extract data (optimized - only process last message)
  const processMessages = (messages: typeof outlineMessages): void => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Extract search results from the last message only (much more efficient)
    if (webSearchEnabled && lastMessage.parts) {
      const searchResults: Array<{ query: string; results: unknown[] }> = [];

      for (const part of lastMessage.parts) {
        if (part.type === "tool-invocation" && part.toolInvocation) {
          const invocation = part.toolInvocation;
          if (
            invocation.toolName === "webSearch" &&
            invocation.state === "result" &&
            "result" in invocation &&
            invocation.result
          ) {
            const query =
              typeof invocation.args?.query === "string"
                ? invocation.args.query
                : "Unknown query";

            // Parse the search result
            let parsedResult;
            try {
              parsedResult =
                typeof invocation.result === "string"
                  ? JSON.parse(invocation.result)
                  : invocation.result;
            } catch {
              parsedResult = invocation.result;
            }

            searchResults.push({
              query,
              results: parsedResult?.results || [],
            });
          }
        }
      }

      // Store search results in buffer (only if we found any)
      if (searchResults.length > 0) {
        searchResultsBufferRef.current = searchResults;
      }
    }

    if (lastMessage.role === "assistant") {
      const messageText = getChatMessageText(lastMessage);
      if (messageText.length > 0) {
        applyOutlineFromText(messageText);
      }
    }
  };

  // Function to update outline and search results using requestAnimationFrame
  const updateOutlineWithRAF = (): void => {
    // Batch all updates in a single RAF callback for better performance

    // Update search results if available
    if (searchResultsBufferRef.current !== null) {
      setSearchResults(searchResultsBufferRef.current);
      searchResultsBufferRef.current = null;
    }

    // Update outline if available
    if (outlineBufferRef.current !== null) {
      setOutline(outlineBufferRef.current);
      outlineBufferRef.current = null;
    }

    // Clear the current frame ID
    outlineRafIdRef.current = null;
  };

  const onFinishOutlineRef = useRef<() => void>(() => {});
  onFinishOutlineRef.current = () => {
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
    setShouldStartPresentationGeneration(false);
    outlineGenerationStartedRef.current = false;

    const {
      currentPresentationId: activeId,
      outline: activeOutline,
      searchResults: activeSearchResults,
      currentPresentationTitle: activeTitle,
      theme: activeTheme,
      imageSource: activeImgSrc,
    } = usePresentationState.getState();

    if (activeId) {
      void updatePresentation({
        id: activeId,
        outline: activeOutline,
        searchResults: activeSearchResults,
        prompt: presentationInput,
        title: activeTitle ?? "",
        theme: activeTheme,
        imageSource: activeImgSrc,
      });
    }

    // Cancel any pending outline animation frame
    if (outlineRafIdRef.current !== null) {
      cancelAnimationFrame(outlineRafIdRef.current);
      outlineRafIdRef.current = null;
    }
  };

  const onErrorOutlineRef = useRef<(error: Error) => void>(() => {});
  onErrorOutlineRef.current = (error) => {
    toast.error(`Failed to generate outline: ${error.message}`);
    resetGeneration();
    outlineGenerationStartedRef.current = false;

    // Cancel any pending outline animation frame
    if (outlineRafIdRef.current !== null) {
      cancelAnimationFrame(outlineRafIdRef.current);
      outlineRafIdRef.current = null;
    }
  };

  const handleFinishOutline = useCallback(
    (message: { content?: unknown; parts?: Array<{ type?: string; text?: string }> }) => {
      const messageText = getChatMessageText(message);
      if (messageText.length > 0) {
        applyOutlineFromText(messageText);
        if (outlineRafIdRef.current === null) {
          outlineRafIdRef.current = requestAnimationFrame(() =>
            updateOutlineWithRAFRef.current(),
          );
        } else {
          updateOutlineWithRAFRef.current();
        }
      }
      onFinishOutlineRef.current();
    },
    [],
  );

  const handleErrorOutline = useCallback((error: Error) => {
    onErrorOutlineRef.current(error);
  }, []);

  const outlineBody = useMemo(
    () => ({
      prompt: presentationInput,
      numberOfCards: numSlides,
      language,
      textModel,
    }),
    [presentationInput, numSlides, language, textModel],
  );

  // Outline generation with or without web search
  const { messages: outlineMessages, append: appendOutlineMessage } = useChat({
    api: webSearchEnabled
      ? "/api/presentation/outline-with-search"
      : "/api/presentation/outline",
    body: outlineBody,
    onFinish: handleFinishOutline,
    onError: handleErrorOutline,
  });

  const processMessagesRef = useRef(processMessages);
  processMessagesRef.current = processMessages;

  const updateOutlineWithRAFRef = useRef(updateOutlineWithRAF);
  updateOutlineWithRAFRef.current = updateOutlineWithRAF;

  // Lightweight useEffect that only schedules RAF updates
  useEffect(() => {
    // Only update if we have new messages
    if (outlineMessages.length >= 1) {
      lastProcessedMessagesLength.current = outlineMessages.length;

      // Process messages and store in buffers (non-blocking)
      processMessagesRef.current(outlineMessages);

      // Only schedule a new frame if one isn't already pending
      if (outlineRafIdRef.current === null) {
        outlineRafIdRef.current = requestAnimationFrame(() =>
          updateOutlineWithRAFRef.current(),
        );
      }
    }
  }, [outlineMessages]);

  // Watch for outline generation start
  useEffect(() => {
    const startOutlineGeneration = async (): Promise<void> => {
      if (shouldStartOutlineGeneration) {
        if (outlineGenerationStartedRef.current) return;
        outlineGenerationStartedRef.current = true;
        // Clear flag immediately to prevent duplicate trigger loops during async calls
        setShouldStartOutlineGeneration(false);
        try {
          // Reset all state except ID and input when starting new generation
          resetForNewGeneration();

          // Reset processing refs for new generation
          titleExtractedRef.current = false;
          queuedSlideIds.current.clear();
          outlineGenerationStartedRef.current = true; // explicitly preserve state after reset

          setIsGeneratingOutline(true);

          // Get the current input after reset (it's preserved)
          const {
            presentationInput: activeInput,
            numSlides: activeNum,
            language: activeLang,
            textModel: activeTextModel,
          } = usePresentationState.getState();

          // Start the RAF cycle for outline updates
          if (outlineRafIdRef.current === null) {
            outlineRafIdRef.current = requestAnimationFrame(() =>
              updateOutlineWithRAFRef.current(),
            );
          }

          await appendOutlineMessage(
            {
              role: "user",
              content: activeInput,
            },
            {
              body: {
                prompt: activeInput,
                numberOfCards: activeNum,
                language: activeLang,
                textModel: activeTextModel,
              },
            },
          );
        } catch (error) {
          console.error(error);
          outlineGenerationStartedRef.current = false;
          // Error is handled by onError callback
        } finally {
          setIsGeneratingOutline(false);
        }
      }
    };

    void startOutlineGeneration();
  }, [
    shouldStartOutlineGeneration,
    appendOutlineMessage,
    resetForNewGeneration,
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
  ]);

  const generateSlidesSequentially = useCallback(async () => {
    const state = usePresentationState.getState();
    const {
      presentationInput: activeInput,
      language: activeLang,
      presentationStyle: activeStyle,
      currentPresentationTitle: activeTitle,
      searchResults: stateSearchResults,
      textModel: activeTextModel,
      outline: activeOutline,
      setThumbnailUrl,
    } = state;

    if (!activeOutline?.length) return;

    slideGenerationAbortRef.current?.abort();
    slideGenerationAbortRef.current = new AbortController();
    const signal = slideGenerationAbortRef.current.signal;

    queuedSlideIds.current.clear();
    setIsGeneratingPresentation(true);
    setThumbnailUrl(undefined);
    setSlides([]);

    const accumulatedSlides: PlateSlide[] = [];

    try {
      for (let i = 0; i < activeOutline.length; i++) {
        if (signal.aborted) break;

        const requiredComponent = getRequiredComponent(activeStyle, i);
        const layout = getLayoutForSlide(i);

        const response = await fetch("/api/presentation/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "slide",
            title: activeTitle ?? activeInput ?? "",
            prompt: activeInput ?? "",
            outline: activeOutline,
            outlineItem: activeOutline[i],
            slideIndex: i,
            totalSlides: activeOutline.length,
            requiredComponent,
            layout,
            searchResults: stateSearchResults,
            language: activeLang,
            tone: activeStyle,
            textModel: activeTextModel,
          }),
          signal,
        });

        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error ?? `Slide ${i + 1} generation failed`);
        }

        const { xml } = (await response.json()) as { xml: string };
        const wrapped = xml.includes("<PRESENTATION")
          ? xml
          : `<PRESENTATION>${xml}</PRESENTATION>`;

        const parser = new SlideParser();
        parser.parseChunk(wrapped);
        parser.finalize();
        const parsed = parser.getAllSlides();
        const newSlide = parsed[parsed.length - 1] ?? parsed[0];
        if (newSlide) {
          accumulatedSlides.push(newSlide);
          const merged = mergeRootImagesIntoSlides([...accumulatedSlides]);
          const {
            theme: activeTheme,
            customThemeData,
            presentationColorMode,
            config,
          } = usePresentationState.getState();
          const typography = config.typography as
            | { heading?: string; body?: string }
            | undefined;
          setSlides(
            bakeThemeIntoSlides(
              merged,
              typeof activeTheme === "string" ? activeTheme : "mystique",
              presentationColorMode,
              customThemeData,
              typography,
            ),
          );
        }
      }

      const finalState = usePresentationState.getState();
      if (
        finalState.currentPresentationId &&
        finalState.slides.length > 0
      ) {
        await updatePresentation({
          id: finalState.currentPresentationId,
          content: { slides: finalState.slides, config: finalState.config },
          title: finalState.currentPresentationTitle ?? undefined,
          outline: finalState.outline,
          imageSource: finalState.imageSource,
          presentationStyle: finalState.presentationStyle,
          language: finalState.language,
          thumbnailUrl: finalState.thumbnailUrl,
        });
      }
    } catch (error) {
      if (signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Generation failed";
      toast.error(`Failed to generate presentation: ${message}`);
      resetGeneration();
    } finally {
      setIsGeneratingPresentation(false);
      setShouldStartPresentationGeneration(false);
      presentationGenerationStartedRef.current = false;
    }
  }, [
    mergeRootImagesIntoSlides,
    resetGeneration,
    setIsGeneratingPresentation,
    setShouldStartPresentationGeneration,
    setSlides,
  ]);

  useEffect(() => {
    if (!shouldStartPresentationGeneration) return;
    if (!outline || outline.length === 0) return;
    if (presentationGenerationStartedRef.current) return;

    presentationGenerationStartedRef.current = true;
    setShouldStartPresentationGeneration(false);
    void generateSlidesSequentially();
  }, [
    shouldStartPresentationGeneration,
    outline,
    generateSlidesSequentially,
    setShouldStartPresentationGeneration,
  ]);

  // Debounced incremental persistence while streaming text
  const debouncedStreamSaveRef = useRef(
    debounce(async () => {
      try {
        const s = usePresentationState.getState();
        if (!s.currentPresentationId || s.slides.length === 0) return;
        await updatePresentation({
          id: s.currentPresentationId,
          content: { slides: s.slides, config: s.config },
          title: s.currentPresentationTitle ?? undefined,
        });
      } catch (_e) {
        // swallow; withDbRetry inside action and next run will try again
      }
    }, 1200),
  );

  useEffect(() => {
    if (
      isGeneratingPresentation &&
      slides.length > 0 &&
      currentPresentationId
    ) {
      debouncedStreamSaveRef.current();
    }
  }, [slides, isGeneratingPresentation, currentPresentationId]);

  // 1. Decoupled UDG Scanner Effect: monitors slides and enqueues completed slides for sequential generation
  useEffect(() => {
    if (!isGeneratingPresentation) return;

    for (const slide of slides) {
      const slideId = slide.id;
      const rootImage = slide.rootImage;

      // We only queue naturally completed slides (avoiding partial queries)
      if (slide.isComplete && rootImage?.query && !rootImage.url) {
        const already = rootImageGeneration[slideId];

        // If not already success, error, or pending, and not already queued in this session
        if (!already || already.status === "error") {
          if (!queuedSlideIds.current.has(slideId)) {
            queuedSlideIds.current.add(slideId);
            startRootImageGeneration(slideId, rootImage.query);
            pushImageToQueue(slideId, rootImage.query);
            console.log(
              `[UDG Scanner] Enqueued completed slide image fetch: ${slideId} (query: "${rootImage.query}")`,
            );
          }
        }
      }
    }
  }, [
    slides,
    isGeneratingPresentation,
    rootImageGeneration,
    startRootImageGeneration,
    pushImageToQueue,
  ]);

  // 2. Manual listener effect: routes manual rootImageGeneration 'pending' requests into the serial UDG Queue
  useEffect(() => {
    if (isGeneratingPresentation || isGeneratingOutline) return;

    for (const [slideId, gen] of Object.entries(rootImageGeneration)) {
      if (gen.status === "pending") {
        if (!queuedSlideIds.current.has(slideId)) {
          const slide = slides.find((s) => s.id === slideId);
          const query = gen.query || slide?.rootImage?.query;
          if (query) {
            queuedSlideIds.current.add(slideId);
            pushImageToQueue(slideId, query);
            console.log(
              `[UDG Manual] Enqueued manual slide image fetch: ${slideId} (query: "${query}")`,
            );
          }
        }
      }
    }
  }, [
    rootImageGeneration,
    isGeneratingPresentation,
    isGeneratingOutline,
    slides,
    pushImageToQueue,
  ]);

  // 3. Sequential UDG Queue Worker Effect: consumes imageQueue serial item by serial item
  useEffect(() => {
    const processQueue = async () => {
      if (isQueueWorkerBusy.current) return;

      const { imageQueue: currentQueue, popImageFromQueue } =
        usePresentationState.getState();
      if (currentQueue.length === 0) return;

      isQueueWorkerBusy.current = true;
      const item = popImageFromQueue();
      if (!item) {
        isQueueWorkerBusy.current = false;
        return;
      }

      const { slideId, query } = item;
      console.log(
        `[UDG Worker] Processing image queue item for slide: ${slideId} (query: "${query}")`,
      );

      try {
        const {
          imageModel: currentImageModel,
          imageSource: currentImageSource,
          currentPresentationId: activePresId,
          slides: activeSlides,
          config: activeConfig,
          currentPresentationTitle: activeTitle,
        } = usePresentationState.getState();

        const slide = activeSlides.find((s) => s.id === slideId);
        let result;

        if (currentImageSource === "stock") {
          const unsplashResult = await getImageFromUnsplash(
            query,
            slide?.rootImage?.layoutType,
          );
          if (unsplashResult.success && unsplashResult.imageUrl) {
            result = { image: { url: unsplashResult.imageUrl } };
          }
        } else {
          result = await generateImageAction(query, currentImageModel);
        }

        if (result?.image?.url) {
          const imageUrl = result.image.url;
          completeRootImageGeneration(slideId, imageUrl);
          console.log(
            `[UDG Worker] Image fetched successfully for slide: ${slideId}`,
          );

          // Sync updated slide into Zustand slides array
          const stateNow = usePresentationState.getState();
          const updatedSlides = stateNow.slides.map((s) =>
            s.id === slideId
              ? {
                  ...s,
                  rootImage: {
                    ...s.rootImage!,
                    url: imageUrl,
                  },
                }
              : s,
          );
          setSlides(updatedSlides);

          // If thumbnail doesn't exist yet, save it
          if (!stateNow.thumbnailUrl && activePresId) {
            stateNow.setThumbnailUrl(imageUrl);
            try {
              await updatePresentation({
                id: activePresId,
                thumbnailUrl: imageUrl,
              });
            } catch (err) {
              console.error(
                "[UDG Worker] Failed to persist thumbnail to DB:",
                err,
              );
            }
          }

          // PERSIST IMMEDIATELY TO THE DATABASE TO PREVENT LOSS ON RELOAD
          if (activePresId) {
            try {
              await updatePresentation({
                id: activePresId,
                content: { slides: updatedSlides, config: activeConfig },
                title: activeTitle ?? undefined,
              });
              console.log(
                `[UDG Worker] Slide image persisted directly to DB for slide: ${slideId}`,
              );
            } catch (err) {
              console.error(
                `[UDG Worker] Failed to persist slide image to DB:`,
                err,
              );
            }
          }
        } else {
          failRootImageGeneration(slideId, "No image url returned");
        }
      } catch (err) {
        console.error(
          `[UDG Worker] Image generation failed for slide ${slideId}:`,
          err,
        );
        const message =
          err instanceof Error ? err.message : "Image generation failed";
        failRootImageGeneration(slideId, message);
      } finally {
        // Clear from the tracked queued set so it can be re-generated if requested again manually
        queuedSlideIds.current.delete(slideId);
        isQueueWorkerBusy.current = false;

        // Brief timeout to avoid starvation and ensure React updates states
        setTimeout(() => {
          void processQueue();
        }, 100);
      }
    };

    void processQueue();
  }, [
    imageQueue,
    completeRootImageGeneration,
    failRootImageGeneration,
    setSlides,
  ]);

  useEffect(() => {
    return () => {
      slideGenerationAbortRef.current?.abort();
      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    };
  }, []);

  return null;
}
