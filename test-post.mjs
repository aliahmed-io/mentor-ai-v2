async function test() {
  console.log("Sending POST to http://localhost:3000/api/notes/generate...");
  const res = await fetch("http://localhost:3000/api/notes/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Stars",
      text: "A star is a massive, luminous sphere of plasma held together by its own gravity."
    })
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text.slice(0, 500));
}
test();
