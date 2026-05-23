import { NextResponse } from "next/server";

export const maxDuration = 60; // 60 seconds for compilation

export async function POST(req: Request) {
  try {
    const { latex } = await req.json();

    if (!latex) {
      return NextResponse.json({ error: "No latex provided" }, { status: 400 });
    }

    // texlive.net requires specific parameters for POST
    const formData = new FormData();
    formData.append("filecontents[]", latex);
    formData.append("filename[]", "document.tex");
    formData.append("engine", "pdflatex");
    formData.append("return", "pdf");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
    if (!response.ok || contentType !== "application/pdf") {
      if (response.status >= 500) {
        return NextResponse.json(
          { error: "Compilation service unavailable", details: "The public latex compilation server is currently down." },
          { status: 503 },
        );
      }
      const errorText = await response.text();
      console.error("LaTeX compilation failed:", errorText);
      return NextResponse.json(
        { error: "LaTeX compilation failed", details: errorText },
        { status: 500 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="notes.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Compile error:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Compilation service timed out", details: "The public latex compilation server is currently down." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error during compilation" },
      { status: 500 },
    );
  }
}
