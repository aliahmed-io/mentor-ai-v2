const formData = new FormData();
formData.append("file", new Blob(["\\documentclass{article}\\begin{document}Hello World\\end{document}"], { type: "text/plain" }), "notes.tex");

fetch("https://latexonline.cc/data?command=pdflatex", {
  method: "POST",
  body: formData,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}).then(async res => {
  if (res.ok) {
    console.log("Success! PDF Buffer length:", (await res.arrayBuffer()).byteLength);
  } else {
    console.log("Error:", res.status, await res.text());
  }
}).catch(console.error);
