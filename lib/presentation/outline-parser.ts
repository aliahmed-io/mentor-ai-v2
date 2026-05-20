import { removeThinkingTags } from "@/lib/thinking-extractor";

/** Extract plain text from AI SDK chat messages (content string or parts array). */
export function getChatMessageText(message: {
  content?: unknown;
  parts?: Array<{ type?: string; text?: string }>;
}): string {
  if (typeof message.content === "string" && message.content.length > 0) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("");
  }
  return "";
}

export function extractTitleFromOutlineContent(content: string): {
  title: string | null;
  cleanContent: string;
} {
  const titleMatch = content.match(/<TITLE>\s*([\s\S]*?)\s*<\/TITLE>/i);
  if (titleMatch?.[1]) {
    const title = titleMatch[1].trim();
    const cleanContent = content
      .replace(/<TITLE>[\s\S]*?<\/TITLE>/i, "")
      .trim();
    return { title, cleanContent };
  }
  return { title: null, cleanContent: content };
}

/**
 * Parse markdown outline into slide topic strings (each includes heading + bullets).
 */
export function parseOutlineItems(cleanContent: string): string[] {
  const text = removeThinkingTags(cleanContent).trim();
  if (!text) return [];

  // Primary: split on level-1 markdown headings (# Topic)
  const h1Sections = text.split(/^#\s+/gm).filter((s) => s.trim().length > 0);
  if (h1Sections.length > 0) {
    return h1Sections.map((section) => `# ${section.trim()}`);
  }

  // Fallback: level-2 headings (## Topic) when model skips h1
  const h2Sections = text.split(/^##\s+/gm).filter((s) => s.trim().length > 0);
  if (h2Sections.length > 1) {
    return h2Sections.map((section) => `## ${section.trim()}`);
  }

  // Fallback: XML-style numbered topics
  const topicBlocks = [...text.matchAll(/<TOPIC[^>]*>([\s\S]*?)<\/TOPIC>/gi)];
  if (topicBlocks.length > 0) {
    return topicBlocks.map((m) => m[1]!.trim()).filter(Boolean);
  }

  // Fallback: non-empty paragraphs separated by blank lines
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20 && !p.startsWith("<"));
  if (paragraphs.length > 0) {
    return paragraphs;
  }

  return [];
}

export function parseOutlineFromMessageText(raw: string): {
  title: string | null;
  outlineItems: string[];
} {
  const { title, cleanContent } = extractTitleFromOutlineContent(raw);
  const outlineItems = parseOutlineItems(cleanContent);
  return { title, outlineItems };
}
