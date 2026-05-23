import fs from "fs";
const formData = new FormData();
formData.append("file", new Blob([fs.readFileSync("dummy.pdf")], { type: "application/pdf" }), "dummy.pdf");

fetch("http://localhost:3000/api/upload", {
  method: "POST",
  body: formData
}).then(async res => {
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
}).catch(console.error);
