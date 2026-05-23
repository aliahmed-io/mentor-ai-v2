const formData = new URLSearchParams();
formData.append("filecontent", "\\documentclass{article}\\begin{document}Hello World\\end{document}");
formData.append("filename", "document.tex");
formData.append("engine", "pdflatex");
formData.append("return", "pdf");

fetch("https://texlive.net/cgi-bin/latexcgi", {
  method: "POST",
  body: formData,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
}).then(async res => {
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}).catch(console.error);
