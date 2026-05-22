const fs = require('fs');
let code = fs.readFileSync('lib/presentation/layout-templates.ts', 'utf8');

let startIndex = 0;
while (true) {
  let tupleStart = code.indexOf('slots: z.tuple([', startIndex);
  if (tupleStart === -1) break;
  
  let bracketCount = 1;
  let i = tupleStart + 'slots: z.tuple(['.length;
  for (; i < code.length; i++) {
    if (code[i] === '[') bracketCount++;
    else if (code[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) break;
    }
  }
  
  let tupleEnd = code.indexOf(')', i);
  let tupleContent = code.substring(tupleStart + 'slots: z.tuple(['.length, i);
  
  let blocks = [];
  let currentBlock = '';
  let depth = 0;
  for (let c of tupleContent) {
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    
    if (c === ',' && depth === 0) {
      blocks.push(currentBlock);
      currentBlock = '';
    } else {
      currentBlock += c;
    }
  }
  if (currentBlock.trim() !== '') blocks.push(currentBlock);
  
  let objectContent = blocks.map(block => {
    let b = block.trim();
    if (!b) return '';
    let match = b.match(/slotId:\s*z\.literal\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `\n          "${match[1]}": ${b}`;
    }
    return b; 
  }).join(',');
  
  let replacement = 'slots: z.object({' + objectContent + '\n        })';
  code = code.substring(0, tupleStart) + replacement + code.substring(tupleEnd + 1);
  startIndex = tupleStart + replacement.length;
}

fs.writeFileSync('lib/presentation/layout-templates.ts', code);
console.log('Done rewriting layout-templates.ts');
