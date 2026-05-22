# Mentor AI v3: The "Local Zero-Cost" Architecture

This document outlines the blueprint for transitioning the Mentor AI presentation generation engine from a paid cloud API architecture (Google Gemini, OpenAI, Unsplash) to a 100% free, private, and local ecosystem.

## 1. Text Engine (LLM)
**Current:** Google Gemini 2.5 Flash API via `@ai-sdk/google`
**Target:** Qwen 2.5 (14B or 32B) or DeepSeek-V3 via Ollama

### Implementation Steps:
1. **Install Ollama:** Download and install Ollama from [ollama.com](https://ollama.com).
2. **Pull the Model:** Open your terminal and run `ollama run qwen2.5:14b`.
3. **Update Dependencies:** Install the Ollama AI SDK provider in the Next.js project:
   ```bash
   npm install ollama-ai-provider
   ```
4. **Wire up the Model:** In `lib/presentation/generate-model.ts`, replace the Gemini initialization with:
   ```typescript
   import { createOllama } from 'ollama-ai-provider';
   
   const ollama = createOllama({ baseURL: 'http://127.0.0.1:11434/api' });
   export const getModel = () => ollama('qwen2.5:14b');
   ```

*Note: Since local generation is hardware-bound and sequential, generating a 15-slide deck on an RTX 4090 or Mac Studio will take ~2-3 minutes.*

## 2. Image Engine
**Current:** Unsplash API
**Target:** Local Stable Diffusion or Flux

### Implementation Steps:
1. **Host the Model:** Install a local GUI like **Automatic1111** or **ComfyUI** and enable the API endpoint (usually `--api` flag).
2. **Download Checkpoints:** Download a high-quality SDXL or Flux model checkpoint optimized for presentations (clean, vector-style, or photorealistic).
3. **Update the Generator:** In `app/api/presentation/generate/route.ts` or the frontend image resolution logic, instead of hitting the Unsplash endpoint with the `ImageSlot.query`, POST the `creativeBrief` to `http://127.0.0.1:7860/sdapi/v1/txt2img`.
4. **Serve the Image:** Base64 encode the response and embed it directly into the slide XML.

## 3. Web Search Engine
**Current:** API-based (or stubbed)
**Target:** SearXNG (Self-Hosted Metasearch)

### Implementation Steps:
1. **Dockerize SearXNG:** Run SearXNG locally using Docker. This acts as an invisible proxy to scrape Google/Bing without API keys or CAPTCHAs.
   ```bash
   docker run -d -p 8080:8080 searxng/searxng
   ```
2. **Update the Search Action:** In your `fetchWebContext` action, point the HTTP request to `http://127.0.0.1:8080/search?q={query}&format=json`.

## Summary
By running Ollama, Stable Diffusion, and SearXNG locally on your machine, Mentor AI becomes a completely self-contained, zero-cost presentation generation powerhouse. It guarantees ultimate privacy, bypasses all API rate limits, and incurs exactly $0.00 in cloud fees.
