"use client";

import { useChat, useCompletion } from "@ai-sdk/react";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { generateImageAction } from "@/app/_actions/image/generate";
import { getImageFromUnsplash } from "@/app/_actions/image/unsplash";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import { extractThinking } from "@/lib/thinking-extractor";
import { usePresentationState } from "@/states/presentation-state";
import { SlideParser } from "../utils/parser";

function stripXmlCodeBlock(input: string): string {
  let result = input.trim();
  if (result.startsWith("```xml")) {
    result = result.slice(6).trimStart();
  }
  if (result.endsWith("```")) {
    result = result.slice(0, -3).trimEnd();
  }
  return result;
}

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
    setPresentationThinking,
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

  // Create a ref for the streaming parser to persist between renders
  const streamingParserRef = useRef<SlideParser>(new SlideParser());
  // Add refs to track the animation frame IDs
  const slidesRafIdRef = useRef<number | null>(null);
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

  // Function to update slides using requestAnimationFrame (Pure state-updater in UDG)
  const updateSlidesWithRAF = (): void => {
    // Extract thinking for presentation and parse only the remaining content
    const presentationThinkingExtract = extractThinking(presentationCompletion);
    if (presentationThinkingExtract.hasThinking) {
      setPresentationThinking(presentationThinkingExtract.thinking);
    }
    const presentationContentToParse = presentationThinkingExtract.hasThinking
      ? presentationThinkingExtract.content
      : presentationCompletion;

    const processedPresentationCompletion = stripXmlCodeBlock(
      presentationContentToParse,
    );
    streamingParserRef.current.reset();
    streamingParserRef.current.parseChunk(processedPresentationCompletion);
    streamingParserRef.current.finalize();
    const allSlides = streamingParserRef.current.getAllSlides();

    // Merge any completed root image URLs from state into streamed slides
    const mergedSlides = allSlides.map((slide) => {
      const gen = rootImageGeneration[slide.id];
      if (gen?.status === "success" && gen.url && slide.rootImage) {
        return {
          ...slide,
          rootImage: {
            ...slide.rootImage,
            url: gen.url,
          },
        };
      }
      return slide;
    });

    setSlides(mergedSlides);
    slidesRafIdRef.current = null;
  };

  // Function to extract title from content
  const extractTitle = (
    content: string,
  ): { title: string | null; cleanContent: string } => {
    const titleMatch = content.match(/<TITLE>(.*?)<\/TITLE>/i);
    if (titleMatch?.[1]) {
      const title = titleMatch[1].trim();
      const cleanContent = content.replace(/<TITLE>.*?<\/TITLE>/i, "").trim();
      return { title, cleanContent };
    }
    return { title: null, cleanContent: content };
  };

  // Function to process messages and extract data (optimized - only process last message)
  const processMessages = (messages: typeof outlineMessages): void => {
    if (messages.length <= 1) return;

    // Get the last message - this is where all the current data is
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

    // Extract outline from the last assistant message
    if (lastMessage.role === "assistant" && lastMessage.content) {
      // Extract <think> content from assistant message and keep only the remainder for parsing
      const thinkingExtract = extractThinking(lastMessage.content);
      if (thinkingExtract.hasThinking) {
        setOutlineThinking(thinkingExtract.thinking);
      }

      let cleanContent = thinkingExtract.hasThinking
        ? thinkingExtract.content
        : lastMessage.content;

      // Only extract title if we haven't done it yet
      if (!titleExtractedRef.current) {
        const { title, cleanContent: extractedCleanContent } =
          extractTitle(cleanContent);

        cleanContent = extractedCleanContent;

        // Set the title if found and mark as extracted
        if (title) {
          setCurrentPresentation(currentPresentationId, title);
          titleExtractedRef.current = true;
        } else {
          // Title not found yet, don't process outline
          return;
        }
      } else {
        // Title already extracted, just remove it from content if it exists
        cleanContent = cleanContent.replace(/<TITLE>.*?<\/TITLE>/i, "").trim();
      }

      // Parse the outline into sections
      const sections = cleanContent.split(/^# /gm).filter(Boolean);
      const outlineItems: string[] =
        sections.length > 0
          ? sections.map((section) => `# ${section}`.trim())
          : [];

      if (outlineItems.length > 0) {
        outlineBufferRef.current = outlineItems;
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

  const handleFinishOutline = useCallback(() => {
    onFinishOutlineRef.current();
  }, []);

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

  // Stable refs for inline callbacks — prevents dependency array size changes
  // while always calling the latest version of each function
  const updateSlidesWithRAFRef = useRef(updateSlidesWithRAF);
  updateSlidesWithRAFRef.current = updateSlidesWithRAF;

  const processMessagesRef = useRef(processMessages);
  processMessagesRef.current = processMessages;

  const updateOutlineWithRAFRef = useRef(updateOutlineWithRAF);
  updateOutlineWithRAFRef.current = updateOutlineWithRAF;

  // Lightweight useEffect that only schedules RAF updates
  useEffect(() => {
    // Only update if we have new messages
    if (outlineMessages.length > 1) {
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

  const onFinishPresentationRef = useRef<
    (_prompt: string, _completion: string) => Promise<void>
  >(async () => {});
  onFinishPresentationRef.current = async (_prompt, _completion) => {
    setIsGeneratingPresentation(false);
    setShouldStartPresentationGeneration(false);
    presentationGenerationStartedRef.current = false;

    // Persist final slides/content to DB to ensure /presentation/[id] hydrates correctly
    try {
      const state = usePresentationState.getState();
      if (state.currentPresentationId && state.slides.length > 0) {
        await updatePresentation({
          id: state.currentPresentationId,
          content: { slides: state.slides, config: state.config },
          title: state.currentPresentationTitle ?? undefined,
          outline: state.outline,
          imageSource: state.imageSource,
          presentationStyle: state.presentationStyle,
          language: state.language,
          thumbnailUrl: state.thumbnailUrl,
        });
      }
    } catch (e) {
      // Avoid interrupting UX if persistence fails
      console.error("Persist final slides failed:", e);
    }
  };

  const onErrorPresentationRef = useRef<(error: Error) => void>(() => {});
  onErrorPresentationRef.current = (error) => {
    toast.error(`Failed to generate presentation: ${error.message}`);
    resetGeneration();
    streamingParserRef.current.reset();
    presentationGenerationStartedRef.current = false;

    // Cancel any pending animation frame
    if (slidesRafIdRef.current !== null) {
      cancelAnimationFrame(slidesRafIdRef.current);
      slidesRafIdRef.current = null;
    }
  };

  const handleFinishPresentation = useCallback(
    (prompt: string, completion: string) => {
      void onFinishPresentationRef.current(prompt, completion);
    },
    [],
  );

  const handleErrorPresentation = useCallback((error: Error) => {
    onErrorPresentationRef.current(error);
  }, []);

  const { completion: presentationCompletion, complete: generatePresentation } =
    useCompletion({
      api: "/api/presentation/generate",
      onFinish: handleFinishPresentation,
      onError: handleErrorPresentation,
    });

  useEffect(() => {
    if (presentationCompletion) {
      try {
        // Only schedule a new frame if one isn't already pending
        if (slidesRafIdRef.current === null) {
          slidesRafIdRef.current = requestAnimationFrame(() =>
            updateSlidesWithRAFRef.current(),
          );
        }
      } catch (error) {
        console.error("Error processing presentation XML:", error);
        toast.error("Error processing presentation content");
      }
    }
  }, [presentationCompletion]);

  useEffect(() => {
    if (!shouldStartPresentationGeneration) return;

    // Wait for outline to be hydrated — don't clear the flag so this re-runs
    // when outline gets populated from the DB fetch
    if (!outline || outline.length === 0) return;

    if (presentationGenerationStartedRef.current) return;
    presentationGenerationStartedRef.current = true;

    // Clear flag immediately to prevent duplicate trigger loops when generatePresentation reference updates
    setShouldStartPresentationGeneration(false);

    const {
      presentationInput: activeInput,
      language: activeLang,
      presentationStyle: activeStyle,
      currentPresentationTitle: activeTitle,
      searchResults: stateSearchResults,
      textModel: activeTextModel,
      setThumbnailUrl,
    } = usePresentationState.getState();

    // Reset the parser and tracking refs before starting a new generation
    streamingParserRef.current.reset();
    queuedSlideIds.current.clear();
    setIsGeneratingPresentation(true);
    setThumbnailUrl(undefined);
    void generatePresentation(activeInput ?? "", {
      body: {
        title: activeTitle ?? activeInput ?? "",
        prompt: activeInput ?? "",
        outline,
        searchResults: stateSearchResults,
        language: activeLang,
        tone: activeStyle,
        textModel: activeTextModel,
      },
    });
  }, [
    shouldStartPresentationGeneration,
    outline,
    generatePresentation,
    setIsGeneratingPresentation,
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

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (slidesRafIdRef.current !== null) {
        cancelAnimationFrame(slidesRafIdRef.current);
        slidesRafIdRef.current = null;
      }

      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    };
  }, []);

  return null;
}
