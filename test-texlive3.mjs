const formData = new FormData();
formData.append("filecontent", "\\documentclass{article}\\begin{document}Hello World\\end{document}");
formData.append("filename", "document.tex");
formData.append("engine", "pdflatex");
formData.append("return", "pdf");

fetch("https://texlive.net/cgi-bin/latexcgi", {
  method: "POST",
  body: formData
}).then(async res => {
  if (res.headers.get("content-type") === "application/pdf") {
    console.log("Success! PDF Buffer length:", (await res.arrayBuffer()).byteLength);
  } else {
    console.log("Error:", await res.text());
  }
}).catch(console.error);
