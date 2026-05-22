import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownPath = path.join(__dirname, '../docs/presentation-architecture.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// A quick and dirty parser to extract the tables
// The tables are defined between Category headings.
const templateRegex = /\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;

let match;
const templates = [];

while ((match = templateRegex.exec(markdownContent)) !== null) {
  // Ignore header rows
  if (match[1] === 'ID' || match[1].includes('---')) continue;

  const id = match[1].trim();
  const name = match[2].trim();
  const source = match[3].trim();
  const gridCss = match[4].trim();
  const slotsRaw = match[5].trim();

  templates.push({
    id,
    name,
    source,
    gridCss,
    slotsRaw,
  });
}

const parseSlots = (slotsRaw: string) => {
  // We will output the raw string so the developer can refine it later or we can parse it roughly.
  return slotsRaw;
};

let output = `
export interface TemplateSlot {
  id: string;
  type: "heading" | "paragraph" | "bullets" | "icons" | "chart" | "table"
      | "timeline" | "cycle" | "compare" | "before-after" | "pros-cons"
      | "pyramid" | "staircase" | "arrows" | "funnel" | "roadmap"
      | "image" | "callout" | "stat-number" | "swot";
  region: "full" | "left" | "right" | "top" | "bottom" | "center"
        | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  maxWords?: number;
  maxItems?: number;
  maxRows?: number;
  maxCols?: number;
  maxDataPoints?: number;
  maxWordsPerItem?: number;
  maxWordsPerCell?: number;
  headingLevel?: 1 | 2 | 3;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  source: string;
  description: string;
  gridCss: string;
  slots: TemplateSlot[];
  bestFor: string[];
  avoidAfter: string[];
}

export const TEMPLATES: LayoutTemplate[] = [
`;

// Only grab the first 55 templates to avoid the file changes markdown tables
const validTemplates = templates.slice(0, 55);

for (const t of validTemplates) {
  output += `  {
    id: "${t.id}",
    name: "${t.name}",
    category: "uncategorized",
    source: "${t.source}",
    description: "Layout for ${t.name}",
    gridCss: "${t.gridCss}",
    bestFor: [],
    avoidAfter: [],
    // Raw slots: ${t.slotsRaw}
    slots: []
  },
`;
}

output += `];\n`;

const outputPath = path.join(__dirname, '../lib/presentation/layout-templates.ts');
fs.appendFileSync(outputPath, output);

console.log(`Appended ${validTemplates.length} templates.`);
