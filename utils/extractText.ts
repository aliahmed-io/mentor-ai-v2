// utils/extractText.ts
import fs from 'fs'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import Tesseract from 'tesseract.js'


/**
* Extract text from a variety of file types: PDF, DOCX, PPTX, images, and plain text.
* - PDF: pdf-parse
* - DOCX: mammoth
* - PPTX: unzip and parse slide XML for <a:t> nodes (requires fast-xml-parser)
* - Images: OCR using tesseract.js (can be slow)
*/
export async function extractTextFromFile(filePath: string, mimeType?: string) {
mimeType = mimeType || ''
const lower = (filePath || '').toLowerCase()
try {
// PDF
if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
const buffer = fs.readFileSync(filePath)
const data = await pdfParse(buffer)
return data && data.text ? data.text : ''
}

// DOCX
if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lower.endsWith('.docx')) {
const result = await mammoth.extractRawText({ path: filePath })
return result && result.value ? result.value : ''
}


// PPTX
if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || lower.endsWith('.pptx')) {
const zip = new AdmZip(filePath)
const entries = zip.getEntries()
const parser = new XMLParser({ ignoreAttributes: false })
const slides = entries.filter(e => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
let text = ''
for (const s of slides) {
const xml = s.getData().toString('utf8')
const obj = parser.parse(xml)


// collect all a:t nodes recursively
const tMatches: string[] = []
const collect = (node: any) => {
if (!node || typeof node !== 'object') return
for (const k of Object.keys(node)) {
if (k === 'a:t') {
if (Array.isArray(node[k])) node[k].forEach((v:any)=> tMatches.push(String(v)))
else tMatches.push(String(node[k]))
} else {
collect(node[k])
}
}
}
collect(obj)
if (tMatches.length) text += tMatches.join(' ') + ''
}
return text
}


// Images (OCR) - jpg, png, gif, bmp, tiff, webp
if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|bmp|tiff|webp)$/i.test(lower)) {
try {
// tesseract.js can accept file paths in Node environments
const res = await Tesseract.recognize(filePath)
return (res && res.data && res.data.text) ? res.data.text : ''
} catch (err) {
console.error('OCR error', err)
return ''
}
}


// Fallback: read as UTF-8 text
try {
return fs.readFileSync(filePath, 'utf8')
} catch (err) {
return ''
}
} catch (err) {
console.error('extractTextFromFile error', err)
return ''
}
}