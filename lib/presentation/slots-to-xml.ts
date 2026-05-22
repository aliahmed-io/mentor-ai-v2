import type { GeneratedSlideContent, AnySlotContent } from "./layout-templates";

export function generatedSlideToXml(slide: GeneratedSlideContent, layout = "left"): string {
  let xml = `<SECTION layout="${layout}">\n`;
  
  // Find heading
  const headingSlot = slide.slots.find(s => s.type === "heading");
  if (headingSlot) {
    xml += `  <H2>${escapeXml(headingSlot.text)}</H2>\n`;
  }
  
  // Find paragraph
  const paragraphSlot = slide.slots.find(s => s.type === "paragraph");
  if (paragraphSlot) {
    xml += `  <P>${escapeXml(paragraphSlot.text)}</P>\n`;
  }

  // Iterate other slots
  for (const slot of slide.slots) {
    if (slot.type === "heading" || slot.type === "paragraph") continue;
    xml += `  ${slotToXml(slot)}\n`;
  }

  xml += `</SECTION>`;
  return xml;
}

function slotToXml(slot: AnySlotContent): string {
  switch (slot.type) {
    case "image":
      return `<IMG query="${escapeXml(slot.query)}" />`;
    
    case "bullets":
      return `<BULLETS>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </BULLETS>`;
      
    case "icons":
      return `<ICONS>\n` + slot.items.map(item => 
        `    <DIV><ICON query="${escapeXml(item.icon)}" /><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </ICONS>`;
      
    case "timeline":
      return `<TIMELINE>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </TIMELINE>`;
      
    case "cycle":
      return `<CYCLE>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </CYCLE>`;

    case "staircase":
      return `<STAIRCASE>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </STAIRCASE>`;

    case "pyramid":
      return `<PYRAMID>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </PYRAMID>`;

    case "arrows":
      return `<ARROWS>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </ARROWS>`;

    case "arrow-vertical":
      return `<ARROW-VERTICAL>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </ARROW-VERTICAL>`;

    case "boxes":
      return `<BOXES>\n` + slot.items.map(item => 
        `    <DIV><H3>${escapeXml(item.title)}</H3><P>${escapeXml(item.description)}</P></DIV>`
      ).join("\n") + `\n  </BOXES>`;
      
    case "chart":
      return `<CHART charttype="${slot.chartType || 'bar'}">\n` + slot.data.map(d => 
        `    <DATA><LABEL>${escapeXml(d.label)}</LABEL><VALUE>${d.value}</VALUE></DATA>`
      ).join("\n") + `\n  </CHART>`;
      
    case "table":
      const headers = slot.headers.map(h => `<TH>${escapeXml(h)}</TH>`).join("");
      const rows = slot.rows.map(row => 
        `    <TR>` + row.map(cell => `<TD>${escapeXml(cell)}</TD>`).join("") + `</TR>`
      ).join("\n");
      return `<TABLE>\n    <TR>${headers}</TR>\n${rows}\n  </TABLE>`;

    case "compare":
      return `<COMPARE>\n` + slot.sides.map(side => 
        `    <DIV><H3>${escapeXml(side.title)}</H3>` + side.items.map(i => `<LI>${escapeXml(i.text)}</LI>`).join("") + `</DIV>`
      ).join("\n") + `\n  </COMPARE>`;

    case "pros-cons":
      const pros = slot.sides.find(s => s.type === "pros");
      const cons = slot.sides.find(s => s.type === "cons");
      let pcXml = `<PROS-CONS>\n`;
      if (pros) pcXml += `  <PROS><H3>${escapeXml(pros.title)}</H3>` + pros.items.map(i => `<LI>${escapeXml(i.text)}</LI>`).join("") + `</PROS>\n`;
      if (cons) pcXml += `  <CONS><H3>${escapeXml(cons.title)}</H3>` + cons.items.map(i => `<LI>${escapeXml(i.text)}</LI>`).join("") + `</CONS>\n`;
      pcXml += `</PROS-CONS>`;
      return pcXml;

    case "before-after":
      return `<BEFORE-AFTER>\n` + slot.sides.map(side => 
        `    <DIV><H3>${escapeXml(side.title)}</H3><P>${escapeXml(side.text)}</P></DIV>`
      ).join("\n") + `\n  </BEFORE-AFTER>`;

    default:
      return "";
  }
}

function escapeXml(unsafe: string | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
