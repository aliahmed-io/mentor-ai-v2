const fs = require("fs");
let code = fs.readFileSync("lib/presentation/layout-templates.ts", "utf8");

let startIndex = 0;
while (true) {
  const tupleStart = code.indexOf("slots: z.tuple([", startIndex);
  if (tupleStart === -1) break;

  let bracketCount = 1;
  let i = tupleStart + "slots: z.tuple([".length;
  for (; i < code.length; i++) {
    if (code[i] === "[") bracketCount++;
    else if (code[i] === "]") {
      bracketCount--;
      if (bracketCount === 0) break;
    }
  }

  const tupleEnd = code.indexOf(")", i);
  const tupleContent = code.substring(
    tupleStart + "slots: z.tuple([".length,
    i,
  );

  const blocks = [];
  let currentBlock = "";
  let depth = 0;
  for (const c of tupleContent) {
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;

    if (c === "," && depth === 0) {
      blocks.push(currentBlock);
      currentBlock = "";
    } else {
      currentBlock += c;
    }
  }
  if (currentBlock.trim() !== "") blocks.push(currentBlock);

  const objectContent = blocks
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      const match = b.match(/slotId:\s*z\.literal\(['"]([^'"]+)['"]\)/);
      if (match) {
        return `\n          "${match[1]}": ${b}`;
      }
      return b;
    })
    .join(",");

  const replacement = "slots: z.object({" + objectContent + "\n        })";
  code =
    code.substring(0, tupleStart) + replacement + code.substring(tupleEnd + 1);
  startIndex = tupleStart + replacement.length;
}

fs.writeFileSync("lib/presentation/layout-templates.ts", code);
console.log("Done rewriting layout-templates.ts");
