import type { RichComponent } from "./layout-recipes";

export const COMPONENT_XML_EXAMPLES: Record<RichComponent, string> = {
  BULLETS: `<BULLETS>
  <DIV><H3>Key Point One</H3><P>Detailed actionable description with specific context.</P></DIV>
  <DIV><H3>Key Point Two</H3><P>Detailed actionable description with specific context.</P></DIV>
  <DIV><H3>Key Point Three</H3><P>Detailed actionable description with specific context.</P></DIV>
</BULLETS>`,
  ICONS: `<ICONS>
  <DIV><ICON query="rocket" /><H3>Growth</H3><P>Detailed description of rapid expansion and deployment.</P></DIV>
  <DIV><ICON query="shield" /><H3>Security</H3><P>Detailed description of defense-in-depth measures.</P></DIV>
  <DIV><ICON query="target" /><H3>Focus</H3><P>Detailed description of strategic priorities.</P></DIV>
</ICONS>`,
  CHART: `<CHART charttype="bar">
  <DATA><LABEL>Q1</LABEL><VALUE>120</VALUE></DATA>
  <DATA><LABEL>Q2</LABEL><VALUE>210</VALUE></DATA>
  <DATA><LABEL>Q3</LABEL><VALUE>340</VALUE></DATA>
  <DATA><LABEL>Q4</LABEL><VALUE>480</VALUE></DATA>
</CHART>`,
  TABLE: `<TABLE>
  <TR><TH>Metric</TH><TH>Current</TH><TH>Target</TH></TR>
  <TR><TD>Revenue</TD><TD>$1.2M</TD><TD>$2.0M</TD></TR>
  <TR><TD>Users</TD><TD>45K</TD><TD>80K</TD></TR>
  <TR><TD>NPS</TD><TD>62</TD><TD>75</TD></TR>
</TABLE>`,
  TIMELINE: `<TIMELINE>
  <DIV><H3>Phase 1</H3><P>Foundation and planning with measurable milestones.</P></DIV>
  <DIV><H3>Phase 2</H3><P>Build core features and validate with users.</P></DIV>
  <DIV><H3>Phase 3</H3><P>Scale, optimize, and expand market reach.</P></DIV>
</TIMELINE>`,
  CYCLE: `<CYCLE>
  <DIV><H3>Discover</H3><P>Research audience needs and competitive landscape.</P></DIV>
  <DIV><H3>Design</H3><P>Create prototypes and validate hypotheses.</P></DIV>
  <DIV><H3>Deliver</H3><P>Ship, measure, and iterate continuously.</P></DIV>
</CYCLE>`,
  COMPARE: `<COMPARE>
  <DIV><H3>Before</H3><LI>Manual processes</LI><LI>Slow iteration</LI></DIV>
  <DIV><H3>After</H3><LI>Automated workflows</LI><LI>Rapid deployment</LI></DIV>
</COMPARE>`,
  COLUMNS: `<COLUMNS>
  <DIV><H3>Option A</H3><P>Detailed description of the first approach with metrics.</P></DIV>
  <DIV><H3>Option B</H3><P>Detailed description of the second approach with metrics.</P></DIV>
</COLUMNS>`,
  BOXES: `<BOXES>
  <DIV><H3>Speed</H3><P>Sub-second response times for critical operations.</P></DIV>
  <DIV><H3>Scale</H3><P>Handles thousands of concurrent users reliably.</P></DIV>
  <DIV><H3>Security</H3><P>Enterprise-grade encryption and compliance.</P></DIV>
</BOXES>`,
  "BEFORE-AFTER": `<BEFORE-AFTER>
  <DIV><H3>Before</H3><P>Scattered data silos and manual configuration.</P></DIV>
  <DIV><H3>After</H3><P>Unified platform with automated pipelines.</P></DIV>
</BEFORE-AFTER>`,
  "PROS-CONS": `<PROS-CONS>
  <PROS><H3>Advantages</H3><LI>Fast deployment</LI><LI>Low maintenance</LI></PROS>
  <CONS><H3>Trade-offs</H3><LI>Learning curve</LI><LI>Migration effort</LI></CONS>
</PROS-CONS>`,
  PYRAMID: `<PYRAMID>
  <DIV><H3>Vision</H3><P>Top-level strategic goal and north star.</P></DIV>
  <DIV><H3>Strategy</H3><P>Mid-level initiatives that drive outcomes.</P></DIV>
  <DIV><H3>Tactics</H3><P>Ground-level execution and tooling.</P></DIV>
</PYRAMID>`,
  STAIRCASE: `<STAIRCASE>
  <DIV><H3>Level 1</H3><P>Basic capability and ad-hoc processes.</P></DIV>
  <DIV><H3>Level 2</H3><P>Standardized workflows and shared practices.</P></DIV>
  <DIV><H3>Level 3</H3><P>Optimized, automated, and continuously improving.</P></DIV>
</STAIRCASE>`,
  ARROWS: `<ARROWS>
  <DIV><H3>Input</H3><P>Collect and validate raw data sources.</P></DIV>
  <DIV><H3>Process</H3><P>Transform, analyze, and enrich information.</P></DIV>
  <DIV><H3>Output</H3><P>Deliver actionable insights to stakeholders.</P></DIV>
</ARROWS>`,
  "ARROW-VERTICAL": `<ARROW-VERTICAL>
  <DIV><H3>Step 1</H3><P>Discovery and requirements gathering.</P></DIV>
  <DIV><H3>Step 2</H3><P>Implementation and integration.</P></DIV>
  <DIV><H3>Step 3</H3><P>Launch and continuous optimization.</P></DIV>
</ARROW-VERTICAL>`,
};

export const RICH_XML_TAGS = Object.keys(
  COMPONENT_XML_EXAMPLES,
) as RichComponent[];

export function slideXmlHasRichComponent(
  xml: string,
  required?: RichComponent,
): boolean {
  const tags = required ? [required] : (RICH_XML_TAGS as string[]);
  return tags.some((tag) => {
    const open = `<${tag}`;
    const selfClose = `<${tag} `;
    return xml.includes(open) || xml.includes(selfClose);
  });
}
