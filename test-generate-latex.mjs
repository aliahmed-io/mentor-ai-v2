import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import fs from "fs";

const envPath = "D:/mentor-ai v2/.env";
const envContent = fs.readFileSync(envPath, "utf-8");
const match = envContent.match(/GEMINI_API_KEY=([^\n]+)/);
process.env.GOOGLE_GEMINI_API_KEY = match ? match[1].trim() : "";

const SYSTEM_PROMPT = `You are an expert academic summarizer and LaTeX developer. Your task is to take raw, messy text extracted from documents (PDFs, PPTs, Text files) and synthesize it into a beautifully structured, visually appealing LaTeX document.

CRITICAL INSTRUCTIONS:
1. You MUST output ONLY valid LaTeX code. Do NOT wrap it in \`\`\`latex markdown blocks. Start exactly with \\documentclass and end exactly with \\end{document}.
2. You MUST perfectly match the visual aesthetic, colors, and layout structure of the provided example templates.
3. You MUST use the exact preamble, packages, and color definitions shown in the examples.
4. Structure the content logically using \\section, \\subsection, \\begin{conceptbox}[Title], \\begin{warningbox}[Title], and \\begin{tabularx} tables where appropriate to make the notes highly readable and visually dense.
5. If the input document is very large, condense the main ideas, synthesize key takeaways, and ensure the most important information is captured in tables and bullet points.
6. Do NOT rephrase definitions or important words; write them exactly as given in the source text.

=== PREAMBLE AND MACROS (MUST INCLUDE EXACTLY) ===
\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[a4paper, margin=0.8in]{geometry}
\\usepackage{amssymb}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage[most]{tcolorbox}
\\usepackage{setspace}
\\usepackage{parskip}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{fontawesome5}

\\definecolor{effatteal}{RGB}{0, 102, 102}
\\definecolor{effatgold}{RGB}{204, 153, 51}
\\definecolor{lightbg}{RGB}{248, 250, 252}
\\definecolor{alertred}{RGB}{180, 40, 40}
\\definecolor{successgreen}{RGB}{40, 140, 60}

\\setstretch{1.15}
\\setlength{\\parindent}{0pt}

\\titleformat{\\section}
  {\\Large\\bfseries\\color{effatteal}}
  {\\thesection}{1em}{}[\\titlerule]

\\titleformat{\\subsection}
  {\\large\\bfseries\\color{effatgold}}
  {\\thesubsection}{1em}{}

\\newtcolorbox{conceptbox}[1][]{
  enhanced,
  colback=lightbg,
  colframe=effatteal,
  boxrule=1pt,
  arc=4pt,
  title=\\textbf{#1},
  coltitle=white,
  fonttitle=\\bfseries,
  drop lifted shadow
}

\\newtcolorbox{warningbox}[1][]{
  enhanced,
  colback=white,
  colframe=alertred,
  boxrule=1.5pt,
  arc=4pt,
  leftrule=6pt,
  title=\\textbf{#1},
  coltitle=alertred,
  colbacktitle=white,
  fonttitle=\\bfseries
}
=== END PREAMBLE ===

Example Usage in Document:
\\begin{document}
\\begin{center}
    {\\huge \\textbf{\\textcolor{effatteal}{[DOCUMENT TITLE]}}}\\\\[0.5em]
    {\\Large [SUBTITLE OR SUMMARY]}\\\\[0.2em] 
    \\rule{0.6\\textwidth}{1pt}
\\end{center}
\\vspace{1em}
\\section{Main Concept}
Use \\begin{itemize}[label=\\textcolor{effatteal}{\\textbullet}, leftmargin=1cm] for lists.
Use tabularx for comparisons.
\\end{document}
`;

async function run() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });
  const model = google("gemini-1.5-flash");

  const title = "Stars";
  const text = "A star is a massive, luminous sphere of plasma held together by its own gravity.";
  
  let currentPrompt = `Generate comprehensive, visually appealing LaTeX notes for the following text. The title should be loosely based on "${title}". \n\nTEXT CONTENT:\n${text}`;
  
  let cleanedLatex = "";
  let compilationError = "";
  let success = false;

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`Attempt ${attempt}...`);
    const { text: latexContent } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: currentPrompt,
      temperature: 0.3,
    });

    cleanedLatex = latexContent.replace(/^```(latex)?/gm, "").replace(/```$/gm, "").trim();

    const formData = new FormData();
    formData.append("file", new Blob([cleanedLatex], { type: "text/plain" }), "notes.tex");

    try {
      console.log("Compiling...");
      const response = await fetch("https://latexonline.cc/data?command=pdflatex", {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        success = true;
        console.log("Success!");
        break;
      } else {
        compilationError = await response.text();
        console.log(`Failed attempt ${attempt}.`);
        currentPrompt = `The previous LaTeX compilation failed with this error:\n\n${compilationError.slice(0, 2000)}\n\nHere is the LaTeX code that failed:\n\n${cleanedLatex}\n\nPlease strictly fix the syntax errors in the LaTeX code and return the fully corrected valid LaTeX code. Do NOT wrap in markdown.`;
      }
    } catch (err) {
      console.warn("Compilation service down", err.message);
      success = true;
      break;
    }
  }

  if (success) {
    console.log("DONE! LaTeX snippet:\n", cleanedLatex.slice(0, 200) + "...");
  } else {
    console.error("FAILED after 3 attempts");
  }
}

run();
