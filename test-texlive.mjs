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
  console.log("Status:", res.status);
  if (res.ok) {
    console.log("Success! PDF Buffer length:", (await res.arrayBuffer()).byteLength);
  } else {
    console.log("Error:", await res.text());
  }
}).catch(console.error);
