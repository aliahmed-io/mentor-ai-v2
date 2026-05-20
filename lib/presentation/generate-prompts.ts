import type { RichComponent } from "./layout-recipes";
import { COMPONENT_XML_EXAMPLES } from "./xml-component-examples";

export const LAYOUT_COMPONENTS_REFERENCE = `
## AVAILABLE LAYOUT COMPONENTS (XML SCHEMA)
Use these EXACT XML tags. Each bullet/icon item needs H3 + P.

${Object.entries(COMPONENT_XML_EXAMPLES)
  .map(([name, xml]) => `### ${name}\n\`\`\`xml\n${xml}\n\`\`\``)
  .join("\n\n")}
`;

export const singleSlideTemplate = `
You are an expert presentation designer. Generate EXACTLY ONE slide in XML format.

## REQUIREMENTS
1. Output ONLY one <SECTION>...</SECTION> block (optionally wrapped in <PRESENTATION>).
2. layout MUST be "{LAYOUT}".
3. You MUST include the required component: <{REQUIRED_COMPONENT}> (see example below).
4. Include <H2> or <H1> (title slide only), <P> intro paragraph, the required rich component, and <IMG query="..." /> with 10-15+ descriptive words.
5. Language: {LANGUAGE}. Tone/style: {TONE}.
6. Topic for this slide: {OUTLINE_ITEM}
7. Presentation title: {TITLE}. User request: {PROMPT}.

## RESEARCH CONTEXT
{SEARCH_RESULTS}

## REQUIRED COMPONENT EXAMPLE
\`\`\`xml
{COMPONENT_EXAMPLE}
\`\`\`

${LAYOUT_COMPONENTS_REFERENCE}

Output ONLY valid XML. No commentary.
`;

export const repairSlideTemplate = `
Your previous slide XML was INVALID: {REASON}

Regenerate ONE complete <SECTION> slide with:
- layout="{LAYOUT}"
- Required component: <{REQUIRED_COMPONENT}>
- H2 title, P intro, rich component, IMG query

Topic: {OUTLINE_ITEM}
Language: {LANGUAGE}

Example for required component:
\`\`\`xml
{COMPONENT_EXAMPLE}
\`\`\`

Output ONLY the <SECTION>...</SECTION> XML.
`;

export function buildSingleSlidePrompt(params: {
  title: string;
  prompt: string;
  outlineItem: string;
  language: string;
  tone: string;
  layout: string;
  requiredComponent: RichComponent;
  searchResultsText: string;
}): string {
  const example = COMPONENT_XML_EXAMPLES[params.requiredComponent];
  return singleSlideTemplate
    .replace(/{TITLE}/g, params.title)
    .replace(/{PROMPT}/g, params.prompt)
    .replace(/{OUTLINE_ITEM}/g, params.outlineItem)
    .replace(/{LANGUAGE}/g, params.language)
    .replace(/{TONE}/g, params.tone)
    .replace(/{LAYOUT}/g, params.layout)
    .replace(/{REQUIRED_COMPONENT}/g, params.requiredComponent)
    .replace(/{SEARCH_RESULTS}/g, params.searchResultsText)
    .replace(/{COMPONENT_EXAMPLE}/g, example);
}

export function buildRepairSlidePrompt(params: {
  reason: string;
  outlineItem: string;
  language: string;
  layout: string;
  requiredComponent: RichComponent;
}): string {
  const example = COMPONENT_XML_EXAMPLES[params.requiredComponent];
  return repairSlideTemplate
    .replace(/{REASON}/g, params.reason)
    .replace(/{OUTLINE_ITEM}/g, params.outlineItem)
    .replace(/{LANGUAGE}/g, params.language)
    .replace(/{LAYOUT}/g, params.layout)
    .replace(/{REQUIRED_COMPONENT}/g, params.requiredComponent)
    .replace(/{COMPONENT_EXAMPLE}/g, example);
}

export function formatSearchResults(
  searchResults?: Array<{ query: string; results: unknown[] }>,
): string {
  if (!searchResults?.length) return "No research data available.";
  const searchData = searchResults
    .map((searchItem, index: number) => {
      const query = searchItem.query || `Search ${index + 1}`;
      const results = Array.isArray(searchItem.results)
        ? searchItem.results
        : [];
      if (results.length === 0) return "";
      const formattedResults = results
        .map((result: unknown) => {
          const resultObj = result as Record<string, unknown>;
          return `- ${resultObj.title || "No title"}\n  ${resultObj.content || "No content"}\n  ${resultObj.url || "No URL"}`;
        })
        .join("\n");
      return `**Search Query ${index + 1}:** ${query}\n**Results:**\n${formattedResults}\n---`;
    })
    .filter(Boolean)
    .join("\n\n");
  return searchData
    ? `The following research was conducted during outline generation:\n\n${searchData}`
    : "No research data available.";
}

export function stripXmlFromResponse(text: string): string {
  let result = text.trim();
  if (result.startsWith("```xml")) {
    result = result.slice(6).trimStart();
  } else if (result.startsWith("```")) {
    result = result.slice(3).trimStart();
  }
  if (result.endsWith("```")) {
    result = result.slice(0, -3).trimEnd();
  }
  if (!result.includes("<SECTION") && result.includes("<section")) {
    result = result
      .replace(/<section/gi, "<SECTION")
      .replace(/<\/section>/gi, "</SECTION>");
  }
  return result;
}
