import { generateText } from "ai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolvePresentationModel } from "@/lib/presentation/generate-model";

export const maxDuration = 60; // 60 seconds

/**
 * Programmatic auto-fixer: repairs the most common AI layout violations
 * without triggering a costly AI retry. Applied to every generation.
 */
function autoFixLatex(latex: string): string {
  let fixed = latex;

  // 1. Remove markdown fences (belt-and-suspenders, also done later)
  fixed = fixed.replace(/^```(latex)?\s*/gm, "").replace(/^```\s*$/gm, "").trim();

  // 2. Replace bare \begin{tabular}{cols} with \begin{tabularx}{\textwidth}{cols}
  //    and swap fixed-width p{} columns → X so text wraps.
  fixed = fixed.replace(
    /\\begin\{tabular\}(\{[^}]*\})/g,
    (_match, cols) => {
      const fixedCols = cols.replace(/p\{[^}]*\}/g, "X").replace(/l(?=[^l}])/g, "X");
      return `\\begin{tabularx}{\\textwidth}${fixedCols}`;
    }
  );
  fixed = fixed.replace(/\\end\{tabular\}/g, "\\end{tabularx}");

  // 3. Replace \begin{tabularx}{<not \textwidth>}{...} → force \textwidth
  fixed = fixed.replace(
    /\\begin\{tabularx\}\{(?!\\textwidth)[^}]*\}/g,
    "\\begin{tabularx}{\\textwidth}"
  );

  // 4. In tabularx col specs, replace p{...} with X for wrapping
  fixed = fixed.replace(
    /(\\begin\{tabularx\}\{[^}]*\}\{)([^}]*)(\})/g,
    (_m, open, cols, close) => `${open}${cols.replace(/p\{[^}]*\}/g, "X")}${close}`
  );

  // 5. Remove multicols/multicol environments — wrap content inline
  fixed = fixed.replace(/\\begin\{multicols\}\{[^}]*\}/g, "");
  fixed = fixed.replace(/\\end\{multicols\}/g, "");
  fixed = fixed.replace(/\\begin\{multicol\}\{[^}]*\}/g, "");
  fixed = fixed.replace(/\\end\{multicol\}/g, "");
  fixed = fixed.replace(/\\columnbreak/g, "");

  // 6. Collapse minipage side-by-side blocks into sequential vertical content.
  //    Pattern: \begin{minipage}{...} ... \end{minipage}
  fixed = fixed.replace(/\\begin\{minipage\}\{[^}]*\}/g, "");
  fixed = fixed.replace(/\\end\{minipage\}/g, "\\vspace{0.5em}");

  // 7. Remove wrapfigure environments (keep the inner content)
  fixed = fixed.replace(/\\begin\{wrapfigure\}\{[^}]*\}\{[^}]*\}/g, "");
  fixed = fixed.replace(/\\end\{wrapfigure\}/g, "");

  // 8. Remove \resizebox wrappers — strip them, keep inner content
  fixed = fixed.replace(/\\resizebox\{[^}]*\}\{[^}]*\}\{/g, "");

  return fixed;
}

function validateLatexLayout(latex: string): string[] {
  const errors: string[] = [];

  if (latex.includes("\\begin{minipage}")) {
    errors.push("Do NOT use \\begin{minipage}. It causes side-by-side layout issues and page overflows.");
  }
  if (latex.includes("\\begin{tabular}")) {
    errors.push("Do NOT use \\begin{tabular}. You MUST use \\begin{tabularx}{\\textwidth} to prevent table overflow.");
  }
  if (latex.includes("\\resizebox")) {
    errors.push("Do NOT use \\resizebox for tables. Use tabularx with X columns instead.");
  }
  if (latex.includes("\\begin{wrapfigure}")) {
    errors.push("Do NOT use \\begin{wrapfigure}. It causes text wrapping overflow.");
  }
  if (/\\begin\{multicols?\}/.test(latex)) {
    errors.push("Do NOT use \\begin{multicols}. Multi-column layouts cause text to flow off the right edge of the page. All content must flow in a single vertical column.");
  }

  // Check if tabularx is used but missing an X column
  const tabularxRegex = /\\begin\{tabularx\}\{[^}]*\}\{([^}]*)\}/g;
  let match;
  while ((match = tabularxRegex.exec(latex)) !== null) {
    if (!match[1].includes("X")) {
      errors.push(`Found a tabularx environment with column specifier {${match[1]}} that is missing an 'X' column. You MUST use at least one 'X' column so the text wraps properly.`);
    }
  }

  // Check tabularx width is \textwidth
  const tabularxWidthRegex = /\\begin\{tabularx\}\{([^}]*)\}/g;
  while ((match = tabularxWidthRegex.exec(latex)) !== null) {
    if (!match[1].includes("\\textwidth")) {
      errors.push(`Found a tabularx with non-\\textwidth width '{${match[1]}}'. Tables MUST use \\begin{tabularx}{\\textwidth}{...} to stay within page bounds.`);
    }
  }

  return errors;
}

const SYSTEM_PROMPT = `You are an expert academic summarizer and LaTeX developer. Your task is to take raw, messy text extracted from documents (PDFs, PPTs, Text files) and synthesize it into a beautifully structured, visually appealing LaTeX document.

CRITICAL INSTRUCTIONS:
1. You MUST output ONLY valid LaTeX code. Do NOT output ANY conversational filler, markdown, or extra text. Your entire response MUST start exactly with \\documentclass and end exactly with \\end{document}. NEVER say things like "Based on the provided text..." or "Here is the LaTeX code:".
2. You MUST perfectly match the visual aesthetic, colors, and layout structure of the provided example templates.
3. You MUST use the exact preamble, packages, and color definitions shown in the examples.
4. Structure the content logically using \\section, \\subsection, \\begin{conceptbox}[Title], \\begin{warningbox}[Title], and \\begin{tabularx} tables where appropriate to make the notes highly readable and visually dense.
5. The input document may be very large (multiple chapters). You MUST comprehensively cover the ENTIRE provided text. Do not stop after the first section or chapter. Condense the main ideas while ensuring all chapters, key concepts, and takeaways are captured.
6. Do NOT rephrase definitions or important words; write them exactly as given in the source text.
7. CRITICAL TABLE RULE: For any tables, you MUST use \\begin{tabularx}{\\textwidth}{...} so they do not overflow the page bounds. You MUST use the 'X' column specifier for any columns containing descriptions, definitions, or paragraph text so the text wraps properly. NEVER use 'l', 'c', or 'r' for long text columns.

COMMON MISTAKES TO AVOID (FATAL ERRORS):
- NEVER use \\begin{minipage} or \\begin{wrapfigure}. Side-by-side layouts destroy page margins. All content must flow in a single vertical column.
- NEVER use \\begin{multicols} or \\begin{multicol}. Multi-column newspaper-style layouts cause content to overflow the right edge of the page and get cut off.
- NEVER use standard \\begin{tabular} or \\resizebox for tables. Always use \\begin{tabularx}{\\textwidth} with X columns for wrapping.
- NEVER set a tabularx width to anything other than \\textwidth (e.g. do NOT write \\begin{tabularx}{0.5\\textwidth}). ALL tables must span the full \\textwidth.
- NEVER use p{} column specifiers in tables. Always use X (from tabularx) for any column that contains more than a few words.
- NEVER invent or use LaTeX packages or commands that are not explicitly defined in the provided preamble. Doing so will crash the compiler.
- NEVER output markdown formatting (like \`\`\`latex). Output raw LaTeX code only.

=== PREAMBLE AND MACROS (MUST INCLUDE EXACTLY) ===
\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[a4paper, margin=0.8in]{geometry}
\\usepackage{amssymb}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{eurosym}
\\usepackage{textcomp}
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

\\begin{tabularx}{\textwidth}{>{\\bfseries}l X}
\\toprule
\\textcolor{effatteal}{Term} & \\textcolor{effatteal}{Definition} \\\\
\\midrule
Example Concept & This is a detailed explanation that will properly wrap inside the cell because of the X column type, preventing the table from overflowing the page boundaries. \\\\
\\bottomrule
\\end{tabularx}
\\end{document}
`;

const DEPTH_INSTRUCTIONS: Record<string, string> = {
  short: `DEPTH MODE: SHORT — Produce a high-signal summary only. Include:
- A bullet list of the core key ideas and takeaways from each section (one line each).
- A definition table for every domain-specific term or concept that appears in the source.
- Nothing else. Omit examples, elaborations, and secondary points.
- Target length: roughly 1–2 pages.
- STRICT RULE: Every word you write must come directly from the source document. Do not infer, extrapolate, or add context that is not explicitly present in the provided text.`,

  normal: `DEPTH MODE: NORMAL — Produce a well-structured study guide. Include:
- All core ideas with a concise explanation of each (2–4 sentences per concept).
- Definition tables for key terms.
- A dedicated subsection titled "Likely Exam / Quiz Topics" at the end of each major section, listing the specific facts, mechanisms, or distinctions most likely to be tested.
- Omit tangential asides, but keep all named models, frameworks, and processes.
- STRICT RULE: Every word you write must come directly from the source document. Do not infer, extrapolate, or add context that is not explicitly present in the provided text.`,

  detailed: `DEPTH MODE: DETAILED — Produce a comprehensive reformatted reference document. Include:
- Every named concept, argument, example, model, statistic, and process found in the source.
- Full explanations as they appear in the source — condense only truly redundant sentences (identical meaning stated multiple times); write each unique idea exactly once.
- Preserve the exact wording of definitions, formulae, and proper nouns.
- The output should feel like a clean, structured rewrite of the entire source, not a summary.
- STRICT RULE: Every word you write must come directly from the source document. Do not infer, extrapolate, or add context that is not explicitly present in the provided text.`,
};

export async function POST(req: Request) {
  try {
    const { text, title, instructions, depth = "normal" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const customApiKey = cookieStore.get("google_gemini_api_key")?.value;

    // Use quality tier — resolves to Gemini 2.5 Flash
    const model = resolvePresentationModel("quality", {
      geminiKey: customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
    });

    if (!model) {
      return NextResponse.json(
        { error: "AI model not configured" },
        { status: 500 },
      );
    }

    const depthInstruction = DEPTH_INSTRUCTIONS[depth] ?? DEPTH_INSTRUCTIONS.normal;

    let currentPrompt = `${depthInstruction}\n\nGenerate comprehensive, visually appealing LaTeX notes for the following text. The title should be loosely based on "${title}".\n\n`;
    if (instructions?.trim()) {
      currentPrompt += `USER SPECIFIC INSTRUCTIONS:\n${instructions}\n\n`;
    }
    currentPrompt += `TEXT CONTENT:\n${text}`;

    let cleanedLatex = "";
    let compilationError = "";
    let success = false;

    let lastErrorType = "";
    let consecutiveSameError = 0;
    let totalAttempts = 0;
    const MAX_TOTAL_ATTEMPTS = 6;
    const MAX_CONSECUTIVE_SAME = 3;

    function getPromptVariant(failureCount: number, type: "structural" | "compilation", errorMsg: string, failedLatex: string) {
      if (failureCount === 1) {
        if (type === "structural") {
          return `The previous LaTeX generation failed structural validation. You violated the critical layout rules:\n\n${errorMsg}\n\nHere is the LaTeX code that failed:\n\n${failedLatex}\n\nPlease strictly fix these layout issues. You MUST NOT use standard tabular or minipages. Do NOT wrap in markdown.`;
        } else {
          return `The previous LaTeX compilation failed with this error:\n\n${errorMsg.slice(0, 2000)}\n\nHere is the LaTeX code that failed:\n\n${failedLatex}\n\nPlease strictly fix the syntax errors in the LaTeX code and return the fully corrected valid LaTeX code. Do NOT wrap in markdown.`;
        }
      } else if (failureCount === 2) {
        return `CRITICAL WARNING: Your previous fix FAILED. You are repeatedly making the same mistakes.\n\nError:\n${errorMsg.slice(0, 2000)}\n\nHere is your broken code:\n${failedLatex}\n\nDO NOT repeat your previous mistakes. Look closely at the code, carefully identify the problem, and write a perfect, syntax-error-free LaTeX document.`;
      } else {
        return `FINAL ATTEMPT: You have failed to resolve this specific error multiple times. DO NOT reduce the visual quality or remove the advanced formatting. Instead, rethink your approach to fixing this exact bug.\n\nIf this is an 'Undefined control sequence', you are using a command that is not in the preamble. Replace it with standard text or a built-in command.\nIf this is a structural error, you are ignoring the critical rules about tabularx or minipages.\n\nError:\n${errorMsg.slice(0, 2000)}\n\nBroken Code:\n${failedLatex}\n\nAnalyze your code carefully step-by-step, fix the specific bug, and return the full, high-quality document.`;
      }
    }

    while (totalAttempts < MAX_TOTAL_ATTEMPTS) {
      totalAttempts++;
      console.log(`LaTeX generation attempt ${totalAttempts} (Consecutive same error: ${consecutiveSameError})...`);
      
      const { text: latexContent } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: currentPrompt,
        temperature: 0.3, // Low temp for structured, academic output
      });

      // 1. Auto-fix common structural violations programmatically before any validation
      cleanedLatex = autoFixLatex(latexContent);

      // Step 2: Programmatic structural validation (after auto-fix)
      const structuralErrors = validateLatexLayout(cleanedLatex);
      if (structuralErrors.length > 0) {
        const errString = structuralErrors.map(e => "- " + e).join("\n");
        if (errString === lastErrorType) {
          consecutiveSameError++;
        } else {
          consecutiveSameError = 1;
          lastErrorType = errString;
        }

        if (consecutiveSameError >= MAX_CONSECUTIVE_SAME) {
          console.error("Failed due to MAX_CONSECUTIVE_SAME structural errors.");
          compilationError = errString;
          break;
        }

        console.log(`Structural validation failed on attempt ${totalAttempts}`);
        currentPrompt = getPromptVariant(consecutiveSameError, "structural", errString, cleanedLatex);
        continue; // Skip compilation and trigger AI retry immediately
      }

      // Step 3: Test compilation against texlive.net
      const formData = new FormData();
      formData.append("filecontents[]", cleanedLatex);
      formData.append("filename[]", "document.tex");
      formData.append("engine", "pdflatex");
      formData.append("return", "pdf");

      try {
        console.log("Testing compilation...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(
          "https://texlive.net/cgi-bin/latexcgi",
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        );
        clearTimeout(timeoutId);

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType === "application/pdf") {
          success = true;
          console.log("Compilation successful!");
          break; // It compiled successfully!
        } else {
          compilationError = await response.text();
          console.log(`Compilation failed on attempt ${totalAttempts}. Status: ${response.status}`);
          
          if (response.status >= 500) {
            console.warn("Compilation service returned 500+, trusting AI output.");
            success = true;
            break;
          }

          const match = compilationError.match(/!\s+(.*)/);
          const currentErrorType = match ? match[1] : compilationError.slice(0, 100);

          if (currentErrorType === lastErrorType) {
            consecutiveSameError++;
          } else {
            consecutiveSameError = 1;
            lastErrorType = currentErrorType;
          }

          if (consecutiveSameError >= MAX_CONSECUTIVE_SAME) {
            console.error("Failed due to MAX_CONSECUTIVE_SAME compilation errors.");
            break;
          }

          // Prepare prompt for next iteration
          currentPrompt = getPromptVariant(consecutiveSameError, "compilation", compilationError, cleanedLatex);
        }
      } catch (err) {
        console.warn("Compilation service unavailable or timed out, trusting AI output.");
        success = true; 
        break; 
      }
    }

    if (!success) {
      console.error("Failed to generate compilable LaTeX after max attempts.");
      return NextResponse.json(
        { error: "Failed to generate valid LaTeX after multiple attempts. The AI was unable to fix the formatting errors.", details: compilationError },
        { status: 500 }
      );
    }

    return NextResponse.json({ latex: cleanedLatex });
  } catch (error: any) {
    console.error("Notes generation error:", error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 },
    );
  }
}
