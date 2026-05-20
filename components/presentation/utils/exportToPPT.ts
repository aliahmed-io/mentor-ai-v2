import type {
  TColumnElement,
  TColumnGroupElement,
  TElement,
  TTableCellElement,
  TTableElement,
  TTableRowElement,
} from "platejs";
import PptxGenJS from "pptxgenjs";
import type {
  TArrowListElement,
  TArrowListItemElement,
} from "../editor/plugins/arrow-plugin";
import type {
  TBeforeAfterGroupElement,
  TBeforeAfterSideElement,
} from "../editor/plugins/before-after-plugin";
import type {
  TBoxGroupElement,
  TBoxItemElement,
} from "../editor/plugins/box-plugin";
import type {
  TBulletGroupElement,
  TBulletItemElement,
} from "../editor/plugins/bullet-plugin";
import type {
  TCompareGroupElement,
  TCompareSideElement,
} from "../editor/plugins/compare-plugin";
import type {
  TCycleGroupElement,
  TCycleItemElement,
} from "../editor/plugins/cycle-plugin";
import type {
  TIconListElement,
  TIconListItemElement,
} from "../editor/plugins/icon-list-plugin";
import type {
  TVisualizationListElement,
  TVisualizationListItemElement,
} from "../editor/plugins/legacy/visualization-list-plugin";
import type {
  TConsItemElement,
  TProsConsGroupElement,
  TProsItemElement,
} from "../editor/plugins/pros-cons-plugin";
import type {
  TPyramidGroupElement,
  TPyramidItemElement,
} from "../editor/plugins/pyramid-plugin";
import type {
  TSequenceArrowGroupElement,
  TSequenceArrowItemElement,
} from "../editor/plugins/sequence-arrow-plugin";
import type {
  TStairGroupElement,
  TStairItemElement,
} from "../editor/plugins/staircase-plugin";
import type {
  TTimelineGroupElement,
  TTimelineItemElement,
} from "../editor/plugins/timeline-plugin";
import {
  type Frame,
  computeContentArea,
  computeRootImageFrame,
  layoutVerticalFlow,
  SLIDE_HEIGHT_IN,
  SLIDE_WIDTH_IN,
} from "./layoutEngine";
import type { PlateNode, PlateSlide } from "./parser";
import type {
  HeadingElement,
  ImageElement,
  ParagraphElement,
  TChartElement,
} from "./types";

// Type guards for text nodes
interface TextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  generating?: boolean;
  // Optional marks from font plugins
  fontFamily?: string;
  fontSize?: number | string;
  color?: string;
  backgroundColor?: string;
}

interface ImageCropSettings {
  objectFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  objectPosition: {
    x: number;
    y: number;
  };
}

interface RootImage {
  url?: string;
  query: string;
  cropSettings?: ImageCropSettings;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  heading: string;
  muted: string;
  headingFont?: string;
  bodyFont?: string;
}

interface PresentationData {
  slides: PlateSlide[];
}

interface CustomChartElement extends TElement {
  data?: Array<{ label?: string; value?: number; x?: number; y?: number }>;
}

export class PlateJSToPPTXConverter {
  private pptx: PptxGenJS;
  private currentSlide: PptxGenJS.Slide | null = null;

  private readonly SLIDE_WIDTH = SLIDE_WIDTH_IN;
  private readonly SLIDE_HEIGHT = SLIDE_HEIGHT_IN;
  private readonly MARGIN = 0.5;

  // Theme defaults (mirror globals.css earthy workspace palette)
  private THEME: ThemeColors = {
    primary: "4D6B56", // Sage Green
    secondary: "EADFC9", // Warm Cream/Beige
    accent: "729B7F", // Vibrant Sage
    background: "FAF8F5", // Cream Background
    text: "232B28", // Deep Forest Charcoal
    heading: "232B28", // Dark Forest Green Headings
    muted: "8FA098", // Muted Sage Gray
  };

  constructor(theme?: Partial<ThemeColors>) {
    this.pptx = new PptxGenJS();
    this.setupPresentation();
    if (theme) this.applyTheme(theme);
  }

  private setupPresentation() {
    this.pptx.layout = "LAYOUT_16x9";
    this.pptx.theme = {
      headFontFace: "Inter",
      bodyFontFace: "Inter",
    };
  }

  private applyTheme(theme: Partial<ThemeColors>) {
    this.THEME = { ...this.THEME, ...theme };
    if (theme.headingFont || theme.bodyFont) {
      this.pptx.theme = {
        headFontFace: theme.headingFont ?? "Inter",
        bodyFontFace: theme.bodyFont ?? "Inter",
      };
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace("#", "");
    if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
    const num = parseInt(clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  private isLightColor(hex: string): boolean {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return false;
    // Perceived luminance
    const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    return lum > 186; // common threshold
  }

  // Rough text measurement in inches based on width (in) and font size (pt)
  // Heuristic: average character width ≈ 0.5 × fontHeight; fontHeight(in) = fontSize/72
  // So charWidth(in) ≈ 0.5 * (fontSize/72) = fontSize * 0.00694
  // We account for word wrapping by greedily filling lines by char count
  private estimateTextHeight(
    text: string,
    widthIn: number,
    fontSizePt: number,
  ): number {
    const minHeight = Math.max(fontSizePt / 72, 0.3);
    const charWidthIn = Math.max(fontSizePt * 0.00694, 0.05); // clamp
    const charsPerLine = Math.max(Math.floor(widthIn / charWidthIn), 8);
    const words = (text || "").split(/\s+/).filter(Boolean);
    if (words.length === 0) return minHeight + 0.2;

    let lines = 1;
    let current = 0;
    for (const w of words) {
      const len = w.length + 1; // include space
      if (current + len > charsPerLine) {
        lines += 1;
        current = len;
      } else {
        current += len;
      }
    }
    const lineHeightIn = Math.max((fontSizePt / 72) * 1.25, 0.28);
    return lines * lineHeightIn + 0.2; // add small padding
  }

  public async convertToPPTX(
    presentationData: PresentationData,
  ): Promise<PptxGenJS> {
    for (const slide of presentationData.slides) {
      await this.processSlide(slide);
    }
    return this.pptx;
  }

  private async processSlide(slide: PlateSlide) {
    this.currentSlide = this.pptx.addSlide();

    // Set slide background color to match the theme/custom background
    const bgFill = (slide.bgColor || this.THEME.background).replace("#", "");
    this.currentSlide.background = { fill: bgFill };

    // Add root image first (no margins/padding as requested)
    if (slide.rootImage) {
      await this.addRootImage(slide.rootImage, slide.layoutType);
    }

    // Calculate content area based on layout
    const contentArea = this.calculateContentArea(slide);

    // Two-pass: measure → pack → render
    const frames: Frame[] = await layoutVerticalFlow(
      slide.content,
      contentArea,
      async (node, w) => this.processElement(node as PlateNode, 0, 0, w, true),
    );

    for (const frame of frames) {
      await this.processElement(
        frame.node as PlateNode,
        frame.x,
        frame.y,
        frame.w,
        false,
        frame.h,
      );
    }
  }

  private calculateContentArea(slide: PlateSlide) {
    return computeContentArea(slide);
  }

  private async addRootImage(rootImage: RootImage, layoutType?: string) {
    if (!this.currentSlide) return;
    if (!rootImage.url) return;

    const imagePath = rootImage.url as string;
    const frame = computeRootImageFrame(layoutType);

    let imageOptions: PptxGenJS.ImageProps = {
      path: imagePath,
      x: frame.x,
      y: frame.y,
      w: frame.w,
      h: frame.h,
    };

    // Apply sizing based on objectFit setting
    // Default behavior: object-fit "cover" with centered object-position if no cropSettings
    const cropSettings = rootImage.cropSettings;
    const objectFit = cropSettings?.objectFit || "cover";
    const objectPosition = cropSettings?.objectPosition || { x: 0.5, y: 0.5 };

    // Apply sizing according to official PptxGenJS documentation
    if (
      typeof imageOptions.w === "number" &&
      typeof imageOptions.h === "number"
    ) {
      switch (objectFit) {
        case "contain":
          // contain: shrinks image to fit completely within area, preserving ratio
          imageOptions.sizing = {
            type: "contain",
            w: imageOptions.w,
            h: imageOptions.h,
          };
          break;
        case "cover":
          // cover: shrinks image to completely fill area, crops excess, preserving ratio
          imageOptions.sizing = {
            type: "cover",
            w: imageOptions.w,
            h: imageOptions.h,
          };
          break;
        case "fill":
          // fill: no sizing property = default stretch behavior
          break;
        default:
          // Use crop with positioning offsets
          imageOptions.sizing = {
            type: "crop",
            w: imageOptions.w,
            h: imageOptions.h,
            // x, y are positions relative to the source image for cropping
            x: objectPosition.x * imageOptions.w * 0.1, // Adjust multiplier as needed
            y: objectPosition.y * imageOptions.h * 0.1, // Adjust multiplier as needed
          };
          break;
      }
    }

    try {
      this.currentSlide.addImage(imageOptions);
    } catch (error) {
      console.warn("Failed to add root image:", error);
    }
  }

  private async processElement(
    element: PlateNode,
    x: number,
    y: number,
    width: number,
    measureOnly: boolean = false,
    maxHeight?: number,
  ): Promise<number> {
    if (!this.currentSlide) return 0;

    const elementType = (element as TElement).type;

    switch (elementType) {
      case "h1":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          32,
          measureOnly,
          maxHeight,
        );
      case "h2":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          28,
          measureOnly,
          maxHeight,
        );
      case "h3":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          24,
          measureOnly,
          maxHeight,
        );
      case "h4":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          20,
          measureOnly,
          maxHeight,
        );
      case "h5":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          18,
          measureOnly,
          maxHeight,
        );
      case "h6":
        return this.addHeading(
          element as HeadingElement,
          x,
          y,
          width,
          16,
          measureOnly,
          maxHeight,
        );
      case "p":
        return this.addParagraph(
          element as ParagraphElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "bullets":
        return await this.addBullets(
          element as TBulletGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "column_group":
        return await this.addColumns(
          element as TColumnGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "pyramid":
        return await this.addPyramid(
          element as TPyramidGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "arrows":
        return await this.addArrowVisualization(
          element as TArrowListElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "timeline":
        return await this.addTimeline(
          element as TTimelineGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "cycle":
        return await this.addCycle(
          element as TCycleGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "staircase":
        return await this.addStaircase(
          element as TStairGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "icons":
        return await this.addIcons(
          element as TIconListElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "visualization-list":
        return await this.addVisualizationList(
          element as unknown as TVisualizationListElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "image":
      case "img":
        return await this.addImage(
          element as ImageElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "boxes":
        return await this.addBoxes(
          element as TBoxGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "compare":
        return await this.addCompare(
          element as TCompareGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "before-after":
        return await this.addBeforeAfter(
          element as TBeforeAfterGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "pros-cons":
        return await this.addProsCons(
          element as TProsConsGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "arrow-vertical":
        return await this.addArrowVertical(
          element as TSequenceArrowGroupElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "table":
        return await this.addTable(
          element as TTableElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      case "chart-bar":
      case "chart-pie":
      case "chart-line":
      case "chart-area":
      case "chart-radar":
      case "chart-scatter":
        return await this.addChart(
          element as TChartElement,
          x,
          y,
          width,
          measureOnly,
          maxHeight,
        );
      default:
        // Handle unknown elements as paragraphs
        return this.addParagraph(
          element as ParagraphElement,
          x,
          y,
          width,
          measureOnly,
        );
    }
  }

  private addHeading(
    element: HeadingElement,
    x: number,
    y: number,
    width: number,
    fontSize: number,
    measureOnly = false,
    maxHeight?: number,
  ): number {
    const runs = this.extractTextRuns(element);
    const plain =
      runs.length > 0
        ? runs.map((r) => r.text).join(" ")
        : this.extractText(element);
    let height = Math.max(this.estimateTextHeight(plain, width, fontSize), 0.8);
    if (typeof maxHeight === "number")
      height = Math.min(height, Math.max(0.4, maxHeight));
    if (measureOnly) return height;

    const textOptions = this.getTextOptions(element, fontSize);
    // Use accent color for headings to mimic gradient accent
    textOptions.color = this.THEME.accent;

    if (runs.length > 0) {
      const coloredRuns = runs.map((r) => ({
        text: r.text,
        options: { ...(r.options ?? {}), color: this.THEME.accent },
      }));
      this.currentSlide?.addText(coloredRuns, {
        x,
        y,
        w: width,
        h: height,
        ...textOptions,
        align: "left",
        autoFit: true,
        wrap: true,
      });
    } else {
      const text = this.extractText(element);
      this.currentSlide?.addText(text, {
        x,
        y,
        w: width,
        h: height,
        ...textOptions,
        align: "left",
        autoFit: true,
        wrap: true,
      });
    }

    return height;
  }

  private addParagraph(
    element: ParagraphElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): number {
    const text = this.extractText(element);
    if (!text.trim()) return 0.2;
    const textOptions = this.getTextOptions(element, 14);
    let paraHeight = Math.max(
      this.estimateTextHeight(text, width, textOptions.fontSize ?? 14),
      0.6,
    );
    if (typeof maxHeight === "number")
      paraHeight = Math.min(paraHeight, Math.max(0.4, maxHeight));
    if (measureOnly) return paraHeight;

    const runs = this.extractTextRuns(element);
    // Decide paragraph/body text color: force dark text on light backgrounds
    const darkFallback = (this.THEME.secondary || "1F2937").replace("#", "");
    const paragraphColor = this.isLightColor(this.THEME.background)
      ? darkFallback
      : this.THEME.text;
    textOptions.color = paragraphColor;

    if (runs.length > 0) {
      const coloredRuns = runs.map((r) => ({
        text: r.text,
        options: { ...(r.options ?? {}), color: paragraphColor },
      }));
      this.currentSlide?.addText(coloredRuns, {
        x,
        y,
        w: width,
        h: paraHeight,
        ...textOptions,
        align: "left",
        autoFit: true,
        wrap: true,
      });
    } else {
      this.currentSlide?.addText(text, {
        x,
        y,
        w: width,
        h: paraHeight,
        ...textOptions,
        align: "left",
        autoFit: true,
        wrap: true,
      });
    }
    return paraHeight;
  }

  private async addBullets(
    element: TBulletGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const bullets = element.children.filter(
      (child) => (child as TBulletItemElement).type === "bullet",
    ) as TBulletItemElement[];

    const columns = Math.min(
      3,
      Math.max(1, bullets.length <= 2 ? bullets.length : 3),
    );
    const columnWidth = width / columns;
    const gapY = 0.25;
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;
    const colHeights = Array(columns).fill(y);

    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i]!;
      const bulletText = this.extractText(bullet);
      const textHeight = this.estimateTextHeight(
        bulletText,
        columnWidth - 0.6,
        12,
      );
      // pick the column with the smallest current height (waterfall layout)
      const columnIndex = colHeights.indexOf(Math.min(...colHeights));
      const bulletX = x + columnIndex * columnWidth;
      const bulletY = colHeights[columnIndex];

      if (!measureOnly) {
        // number box
        this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
          x: bulletX,
          y: bulletY,
          w: 0.4,
          h: 0.4,
          fill: { color: this.THEME.primary },
          line: { width: 0 },
        });
        this.currentSlide?.addText((i + 1).toString(), {
          x: bulletX,
          y: bulletY,
          w: 0.4,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        });

        // content
        const bulletRuns = this.extractTextRuns(bullet);
        const contentProps = {
          x: bulletX + 0.5,
          y: bulletY,
          w: columnWidth - 0.6,
          h: textHeight,
          fontSize: 12,
          valign: "top" as const,
          align: "left" as const,
          color: this.THEME.text,
          autoFit: true,
          wrap: true,
        };
        if (bulletRuns.length > 0)
          this.currentSlide?.addText(bulletRuns, contentProps);
        else this.currentSlide?.addText(bulletText, contentProps);
      }

      const nextY = bulletY + textHeight + gapY;
      colHeights[columnIndex] = nextY;
      if (nextY > yBottom) break;
    }

    return Math.max(...colHeights) - y + 0.2;
  }

  private async addColumns(
    element: TColumnGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const columns = element.children.filter(
      (child) => (child as TColumnElement).type === "column",
    );
    let currentX = x;
    let maxColHeight = 0;

    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;
    for (const column of columns) {
      const columnElement = column as TColumnElement;
      const columnWidth =
        width * (parseFloat(columnElement.width || "50%") / 100);

      let columnHeight = 0;
      let columnY = y;

      for (const child of columnElement.children) {
        const remaining = Math.min(
          yBottom - columnY,
          maxHeight ?? Number.POSITIVE_INFINITY,
        );
        if (remaining <= 0) break;
        const childHeight = await this.processElement(
          child as PlateNode,
          currentX,
          columnY,
          columnWidth - 0.1,
          measureOnly,
          remaining,
        );
        columnHeight += childHeight;
        columnY += childHeight;
      }

      maxColHeight = Math.max(maxColHeight, columnHeight);
      currentX += columnWidth;
    }

    return maxColHeight;
  }

  private async addVisualizationList(
    element: TVisualizationListElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
  ): Promise<number> {
    const visualizationType = element.visualizationType;

    switch (visualizationType) {
      case "pyramid":
        return await this.addPyramid(
          element as unknown as TPyramidGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "arrow":
        return await this.addArrowVisualization(
          element as unknown as TArrowListElement,
          x,
          y,
          width,
          measureOnly,
        );
      case "timeline":
        return await this.addTimeline(
          element as unknown as TTimelineGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
      default:
        return await this.addPyramid(
          element as unknown as TPyramidGroupElement,
          x,
          y,
          width,
          measureOnly,
        );
    }
  }

  private async addArrowVisualization(
    element: TArrowListElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) =>
      ["arrow-item", "visualization-item"].includes(
        (child as TArrowListItemElement | TVisualizationListItemElement).type,
      ),
    );

    let currentY = y;
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as
        | TArrowListItemElement
        | TVisualizationListItemElement;

      if (!measureOnly) {
        // Draw native right arrow
        this.currentSlide?.addShape(this.pptx.ShapeType.rightArrow, {
          x: x + 0.5,
          y: currentY + 0.05,
          w: 1,
          h: 0.5,
          fill: { color: this.THEME.primary },
          line: { color: "FFFFFF", width: 1 },
        });

        // Add content
        const itemText = this.extractText(item);
        const textH = this.estimateTextHeight(itemText, width - 2.3, 12);
        this.currentSlide?.addText(itemText, {
          x: x + 1.8,
          y: currentY,
          w: width - 2.3,
          h: textH,
          fontSize: 12,
          valign: "middle",
          align: "left",
          color: this.THEME.text,
        });
      }

      const textH2 = this.estimateTextHeight(
        this.extractText(item),
        width - 2.3,
        12,
      );
      currentY += textH2 + 0.2;
      if (currentY > yBottom) break;
    }

    return currentY - y + 0.2;
  }

  private async addPyramid(
    element: TPyramidGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
  ): Promise<number> {
    const items = element.children.filter((child) =>
      ["pyramid-item", "visualization-item"].includes(
        (child as TPyramidItemElement | TVisualizationListItemElement).type,
      ),
    );

    const pyramidHeight = items.length * 0.8;
    const baseWidth = width * 0.8;
    const startX = x + (width - baseWidth) / 2;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as
        | TPyramidItemElement
        | TVisualizationListItemElement;
      const levelWidth = (baseWidth * (i + 1)) / items.length;
      const levelX = startX + (baseWidth - levelWidth) / 2;
      const levelY = y + i * 0.8;

      if (!measureOnly) {
        // Draw native shape: triangle at the top apex, trapezoid for layers below
        const shapeType =
          i === 0
            ? this.pptx.ShapeType.triangle
            : this.pptx.ShapeType.trapezoid;
        this.currentSlide?.addShape(shapeType, {
          x: levelX,
          y: levelY,
          w: levelWidth,
          h: 0.6,
          fill: { color: this.THEME.primary },
          line: { color: "FFFFFF", width: 1.5 },
        });

        // Add content text centered on the shape
        const itemText = this.extractText(item);
        this.currentSlide?.addText(itemText, {
          x: levelX + 0.2,
          y: levelY,
          w: levelWidth - 0.4,
          h: 0.6,
          fontSize: 12,
          color: "FFFFFF",
          valign: "middle",
          align: "center",
        });
      }
    }

    return pyramidHeight + 0.5;
  }

  private async addTimeline(
    element: TTimelineGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) =>
      ["timeline-item", "visualization-item"].includes(
        (child as TTimelineItemElement | TVisualizationListItemElement).type,
      ),
    ) as (TTimelineItemElement | TVisualizationListItemElement)[];

    const orientation = element.orientation || "vertical";
    const sidedness = element.sidedness || "single";

    if (orientation === "vertical") {
      return await this.addVerticalTimeline(
        items,
        x,
        y,
        width,
        sidedness,
        measureOnly,
        maxHeight,
      );
    } else {
      return await this.addHorizontalTimeline(
        items,
        x,
        y,
        width,
        sidedness,
        measureOnly,
        maxHeight,
      );
    }
  }

  private async addVerticalTimeline(
    items: (TTimelineItemElement | TVisualizationListItemElement)[],
    x: number,
    y: number,
    width: number,
    sidedness: string,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;
    if (sidedness === "single") {
      const lineX = x + 0.3;
      let currentY = y;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        if (!measureOnly) {
          // Add timeline circle with number
          this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
            x: lineX - 0.15,
            y: currentY,
            w: 0.3,
            h: 0.3,
            fill: { color: "000000" },
            line: { width: 3, color: "FFFFFF" },
          });

          // Add number
          this.currentSlide?.addText((i + 1).toString(), {
            x: lineX - 0.15,
            y: currentY,
            w: 0.3,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "middle",
          });

          // Add content text (dynamic height)
          const itemText = this.extractText(item);
          const textH = this.estimateTextHeight(itemText, width - 1.4, 11);
          this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
            x: x + 0.8,
            y: currentY - 0.2,
            w: width - 1.2,
            h: textH + 0.2,
            fill: { color: this.THEME.background },
            line: { width: 4, color: this.THEME.primary },
          });
          this.currentSlide?.addText(itemText, {
            x: x + 0.9,
            y: currentY - 0.1,
            w: width - 1.4,
            h: textH,
            fontSize: 11,
            valign: "middle",
            align: "left",
            color: this.THEME.text,
            autoFit: true,
            wrap: true,
          });
        }

        currentY +=
          this.estimateTextHeight(this.extractText(item), width - 1.4, 11) +
          0.6;
        if (currentY > yBottom) break;
      }

      if (!measureOnly) {
        // Draw vertical line exactly matching the rendered height of the timeline
        const lineH = Math.max(0.1, currentY - y - 0.6); // subtract last padding offset
        this.currentSlide?.addShape(this.pptx.ShapeType.line, {
          x: lineX,
          y: y + 0.15,
          w: 0,
          h: lineH,
          line: { width: 3, color: this.THEME.primary },
        });
      }

      return currentY - y + 0.3;
    } else {
      // Double-sided vertical timeline
      let currentY = y;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const isEven = (i + 1) % 2 === 0;

        if (!measureOnly) {
          // Add timeline circle
          this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
            x: x + width / 2 - 0.15,
            y: currentY,
            w: 0.3,
            h: 0.3,
            fill: { color: this.THEME.primary },
            line: { width: 2, color: "FFFFFF" },
          });
        }

        // Add content box (alternating sides)
        const contentX = isEven ? x + width * 0.55 : x;
        const contentW = width * 0.4;

        if (!measureOnly) {
          this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
            x: contentX,
            y: currentY - 0.2,
            w: contentW,
            h: 0.8,
            fill: { color: this.THEME.background },
            line: { width: 1, color: this.THEME.primary },
          });
        }

        // Add content text
        const itemText = this.extractText(item);
        if (!measureOnly) {
          this.currentSlide?.addText(itemText, {
            x: contentX + 0.1,
            y: currentY - 0.1,
            w: contentW - 0.2,
            h: 0.6,
            fontSize: 11,
            valign: "middle",
            align: "left",
          });
        }

        currentY += 1.2;
        if (currentY > yBottom) break;
      }

      if (!measureOnly) {
        // Draw vertical line exactly matching the rendered height of the timeline
        const lineH = Math.max(0.1, currentY - y - 1.2); // subtract last item offset
        this.currentSlide?.addShape(this.pptx.ShapeType.line, {
          x: x + width / 2,
          y: y + 0.15,
          w: 0,
          h: lineH,
          line: { width: 2, color: this.THEME.primary },
        });
      }

      return currentY - y + 0.3;
    }
  }

  private async addHorizontalTimeline(
    items: (TTimelineItemElement | TVisualizationListItemElement)[],
    x: number,
    y: number,
    width: number,
    sidedness: string,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;
    if (sidedness === "single") {
      const lineY = y + 0.8;
      const itemWidth = width / items.length;
      let renderedCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const itemX = x + i * itemWidth + itemWidth / 2;

        const itemText = this.extractText(item);
        const textH = this.estimateTextHeight(itemText, itemWidth * 0.7, 10);
        if (lineY + 0.55 + textH > yBottom) break;
        renderedCount = i + 1;

        if (!measureOnly) {
          // Add timeline circle
          this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
            x: itemX - 0.15,
            y: lineY - 0.15,
            w: 0.3,
            h: 0.3,
            fill: { color: this.THEME.primary },
            line: { width: 2, color: "FFFFFF" },
          });

          // Add content card
          this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
            x: itemX - itemWidth * 0.4,
            y: lineY + 0.5,
            w: itemWidth * 0.8,
            h: textH + 0.2,
            fill: { color: this.THEME.background },
            line: { width: 1, color: this.THEME.primary },
          });

          // Add content text
          this.currentSlide?.addText(itemText, {
            x: itemX - itemWidth * 0.35,
            y: lineY + 0.55,
            w: itemWidth * 0.7,
            h: textH,
            fontSize: 10,
            align: "left",
            valign: "middle",
            autoFit: true,
            wrap: true,
          });
        }
      }

      if (!measureOnly && renderedCount > 0) {
        // Draw horizontal line exactly covering the rendered timeline width
        const totalLineWidth = Math.max(0.5, (renderedCount - 0.5) * itemWidth);
        this.currentSlide?.addShape(this.pptx.ShapeType.line, {
          x: x + itemWidth / 2,
          y: lineY,
          w: totalLineWidth,
          h: 0,
          line: { width: 3, color: this.THEME.primary },
        });
      }

      return 2.5;
    } else {
      // Double-sided horizontal timeline
      const lineY = y + 1.5;
      const itemWidth = width / items.length;
      let renderedCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const isAbove = i % 2 === 0;

        const itemText = this.extractText(item);
        const textH = this.estimateTextHeight(itemText, itemWidth * 0.7, 10);
        const boxY = isAbove ? lineY - (textH + 0.6) : lineY + 0.5;

        if ((isAbove ? boxY : boxY + textH) > yBottom) break;
        renderedCount = i + 1;

        if (!measureOnly) {
          const itemX = x + i * itemWidth + itemWidth / 2;

          // Add timeline circle
          this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
            x: itemX - 0.2,
            y: lineY - 0.2,
            w: 0.4,
            h: 0.4,
            fill: { color: this.THEME.primary },
            line: { width: 4, color: "FFFFFF" },
          });

          // Add number
          this.currentSlide?.addText((i + 1).toString(), {
            x: itemX - 0.2,
            y: lineY - 0.2,
            w: 0.4,
            h: 0.4,
            fontSize: 10,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "middle",
          });

          // Add content box above/below alternating
          this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
            x: itemX - itemWidth * 0.4,
            y: boxY,
            w: itemWidth * 0.8,
            h: textH + 0.2,
            fill: { color: this.THEME.background },
            line: { width: 1, color: this.THEME.primary },
          });

          // Add content text
          this.currentSlide?.addText(itemText, {
            x: itemX - itemWidth * 0.35,
            y: boxY + 0.05,
            w: itemWidth * 0.7,
            h: textH,
            fontSize: 10,
            align: "left",
            valign: "middle",
            autoFit: true,
            wrap: true,
          });
        }
      }

      if (!measureOnly && renderedCount > 0) {
        // Draw horizontal line exactly covering the rendered timeline width
        const totalLineWidth = Math.max(0.5, (renderedCount - 1) * itemWidth);
        this.currentSlide?.addShape(this.pptx.ShapeType.line, {
          x: x + itemWidth / 2,
          y: lineY,
          w: totalLineWidth,
          h: 0,
          line: { width: 2, color: this.THEME.primary },
        });
      }

      return 3.5;
    }
  }

  private async addCycle(
    element: TCycleGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) =>
      ["cycle-item", "visualization-item"].includes(
        (child as TCycleItemElement | TVisualizationListItemElement).type,
      ),
    );

    const centerX = x + width / 2;
    const centerY = y + 1.5;
    const radius = Math.min(width / 3, 1.2);
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;

    if (!measureOnly) {
      // Draw outer connecting ring
      this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
        x: centerX - radius,
        y: centerY - radius,
        w: radius * 2,
        h: radius * 2,
        fill: { color: "none" },
        line: { color: this.THEME.accent, width: 3 },
      });

      // Draw center cycle wheel circle shape
      this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
        x: centerX - 0.4,
        y: centerY - 0.4,
        w: 0.8,
        h: 0.8,
        fill: { color: this.THEME.primary },
        line: { color: "FFFFFF", width: 1.5 },
      });
    }

    // Position items around circle
    let maxBottom = centerY + radius + 0.4; // include wheel extent
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
      const itemX = centerX + radius * Math.cos(angle);
      const itemY = centerY + radius * Math.sin(angle);

      if (!measureOnly) {
        // Add item circle
        this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
          x: itemX - 0.2,
          y: itemY - 0.2,
          w: 0.4,
          h: 0.4,
          fill: { color: this.getCycleColor(i) },
          line: { width: 1, color: "FFFFFF" },
        });

        // Add number
        this.currentSlide?.addText((i + 1).toString(), {
          x: itemX - 0.2,
          y: itemY - 0.2,
          w: 0.4,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        });

        // Add content text
        const itemText = this.extractText(item);
        const textRadius = radius + 0.5;
        const textX = centerX + textRadius * Math.cos(angle) - 0.8;
        const textY = centerY + textRadius * Math.sin(angle) - 0.2;
        const textW = 1.6;
        const textH = this.estimateTextHeight(itemText, textW, 10);
        const clampedX = Math.max(x, Math.min(x + width - textW, textX));
        const clampedY = Math.max(y, textY);
        if (clampedY + textH <= yBottom) {
          this.currentSlide?.addText(itemText, {
            x: clampedX,
            y: clampedY,
            w: textW,
            h: textH,
            fontSize: 10,
            align: "center",
            valign: "middle",
            autoFit: true,
            wrap: true,
          });
        }
        maxBottom = Math.max(maxBottom, clampedY + textH);
      }
    }

    return Math.max(maxBottom - y + 0.3, 3.0);
  }

  private async addStaircase(
    element: TStairGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
  ): Promise<number> {
    const items = element.children.filter((child) =>
      ["stair-item", "visualization-item"].includes(
        (child as TStairItemElement | TVisualizationListItemElement).type,
      ),
    );

    const baseWidth = 1;
    const maxWidth = 3;
    const increment = (maxWidth - baseWidth) / (items.length - 1 || 1);
    let currentY = y;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const stepWidth = baseWidth + i * increment;

      if (!measureOnly) {
        // Add step rectangle
        this.currentSlide?.addShape(this.pptx.ShapeType.rect, {
          x: x,
          y: currentY,
          w: stepWidth,
          h: 0.6,
          fill: { color: this.THEME.primary },
          line: { width: 1, color: "2F4F4F" },
        });

        // Add number
        this.currentSlide?.addText((i + 1).toString(), {
          x: x + 0.1,
          y: currentY + 0.1,
          w: 0.4,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        });

        // Add content
        const itemText = this.extractText(item);
        this.currentSlide?.addText(itemText, {
          x: x + stepWidth + 0.2,
          y: currentY,
          w: width - stepWidth - 0.3,
          h: 0.6,
          fontSize: 12,
          valign: "middle",
          align: "left",
        });
      }

      currentY += 0.8;
    }

    return currentY - y + 0.2;
  }

  private async addIcons(
    element: TIconListElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
  ): Promise<number> {
    const items = element.children.filter(
      (child) => (child as TIconListItemElement).type === "icon-item",
    );

    const columns = Math.min(3, Math.max(1, items.length));
    const columnWidth = width / columns;
    let maxHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as TIconListItemElement;
      const columnIndex = i % columns;
      const rowIndex = Math.floor(i / columns);

      const itemX = x + columnIndex * columnWidth;
      const itemY = y + rowIndex * 1.5;

      if (!measureOnly) {
        // Add icon placeholder
        this.currentSlide?.addShape(this.pptx.ShapeType.ellipse, {
          x: itemX + columnWidth / 2 - 0.3,
          y: itemY,
          w: 0.6,
          h: 0.6,
          fill: { color: this.THEME.primary },
          line: { width: 1, color: "FFFFFF" },
        });

        // Add icon text/content
        const itemText = this.extractText(item);
        this.currentSlide?.addText(itemText, {
          x: itemX,
          y: itemY + 0.8,
          w: columnWidth,
          h: 0.5,
          fontSize: 11,
          align: "center",
          valign: "middle",
        });
      }

      maxHeight = Math.max(maxHeight, (rowIndex + 1) * 1.5 + 0.5);
    }

    return maxHeight;
  }

  private async addImage(
    element: ImageElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const imageUrl: string | undefined = (element as Partial<ImageElement>).url;
    let height = 2; // Default image height
    if (typeof maxHeight === "number")
      height = Math.min(height, Math.max(0.5, maxHeight));

    if (!measureOnly && imageUrl && this.currentSlide) {
      try {
        const imageOptions: PptxGenJS.ImageProps = {
          path: imageUrl,
          x,
          y,
          w: width,
          h: height,
        };

        // Apply sizing based on objectFit setting (based on official PptxGenJS docs)
        // Default behavior: object-fit "cover" with centered object-position if no cropSettings
        const cropSettings = (
          element as unknown as { cropSettings?: ImageCropSettings }
        ).cropSettings;
        const objectFit = cropSettings?.objectFit || "cover";
        const objectPosition = cropSettings?.objectPosition || {
          x: 0.5,
          y: 0.5,
        };

        // Apply sizing according to official PptxGenJS documentation
        switch (objectFit) {
          case "contain":
            // contain: shrinks image to fit completely within area, preserving ratio
            imageOptions.sizing = {
              type: "contain",
              w: width,
              h: height,
            };
            break;
          case "cover":
            // cover: shrinks image to completely fill area, crops excess, preserving ratio
            imageOptions.sizing = {
              type: "cover",
              w: width,
              h: height,
            };
            break;
          case "fill":
            // fill: no sizing property = default stretch behavior
            break;
          default:
            // Use crop with positioning offsets
            imageOptions.sizing = {
              type: "crop",
              w: width,
              h: height,
              // x, y are positions relative to the source image for cropping
              x: objectPosition.x * width * 0.1, // Adjust multiplier as needed
              y: objectPosition.y * height * 0.1, // Adjust multiplier as needed
            };
            break;
        }
        this.currentSlide.addImage(imageOptions);
      } catch (error) {
        console.warn("Failed to add image:", error);
      }
    }

    return height + 0.2;
  }

  // Helper Methods
  private extractText(element: unknown): string {
    const isTextNode = (n: unknown): n is TextNode => {
      if (!n || typeof n !== "object") return false;
      return "text" in (n as Record<string, unknown>);
    };
    const hasChildren = (n: unknown): n is { children: unknown[] } => {
      if (!n || typeof n !== "object") return false;
      return Array.isArray((n as { children?: unknown }).children);
    };

    if (isTextNode(element)) {
      return element.text ?? "";
    }

    if (hasChildren(element)) {
      return element.children
        .map((child) => this.extractText(child))
        .join(" ")
        .trim();
    }

    return "";
  }

  private getTextOptions(
    element: PlateNode,
    fontSize: number,
  ): PptxGenJS.TextPropsOptions {
    const options: PptxGenJS.TextPropsOptions = {
      fontSize,
      color: this.THEME.text,
    };

    // Extract text styling from first text node
    if (
      "children" in element &&
      element.children &&
      element.children.length > 0
    ) {
      const firstChild = element.children[0] as Partial<TextNode> &
        Partial<{
          fontFamily: string;
          color: string;
          fontSize: number | string;
        }>;
      if (typeof firstChild === "object" && firstChild) {
        if (typeof firstChild.fontFamily === "string")
          options.fontFace = firstChild.fontFamily as string;
        if (
          typeof firstChild.fontSize === "number" ||
          typeof firstChild.fontSize === "string"
        ) {
          const parsed = this.parseFontSizeToPoints(
            firstChild.fontSize as number | string,
          );
          if (parsed) options.fontSize = parsed;
        }
        if (typeof firstChild.color === "string") {
          const raw = (firstChild.color as string).trim();
          // Only accept direct hex; ignore CSS variables like var(--presentation-text)
          const hexMatch = raw.match(/^#?[0-9A-Fa-f]{6}$/);
          if (hexMatch) options.color = raw.replace("#", "");
        }
      }
    }

    // Ensure default Inter fallback if not set via marks
    if (!options.fontFace) options.fontFace = "Inter";

    return options;
  }

  private extractTextRuns(element: unknown): PptxGenJS.TextProps[] {
    const runs: PptxGenJS.TextProps[] = [];

    const isTextNode = (n: unknown): n is TextNode => {
      if (!n || typeof n !== "object") return false;
      return "text" in (n as Record<string, unknown>);
    };
    const hasChildren = (n: unknown): n is { children: unknown[] } => {
      if (!n || typeof n !== "object") return false;
      return Array.isArray((n as { children?: unknown }).children);
    };

    const walk = (node: unknown) => {
      if (isTextNode(node)) {
        const text = node.text ?? "";
        if (text.length === 0) return;
        const runOptions: PptxGenJS.TextPropsOptions = {};
        if (node.bold) runOptions.bold = true;
        if (node.italic) runOptions.italic = true;
        if (node.underline) runOptions.underline = { style: "sng" };
        if (node.strikethrough) runOptions.strike = true;
        // Font family per-run
        if (typeof node.fontFamily === "string" && node.fontFamily.trim()) {
          runOptions.fontFace = node.fontFamily.trim();
        }
        // Font size per-run
        if (
          typeof node.fontSize === "number" ||
          typeof node.fontSize === "string"
        ) {
          const parsed = this.parseFontSizeToPoints(node.fontSize);
          if (parsed) runOptions.fontSize = parsed;
        }
        // Text color per-run (hex only)
        if (typeof node.color === "string") {
          const raw = node.color.trim();
          const hexMatch = raw.match(/^#?[0-9A-Fa-f]{6}$/);
          if (hexMatch) runOptions.color = raw.replace("#", "");
        }
        // Background highlight per-run
        if (typeof node.backgroundColor === "string") {
          const raw = node.backgroundColor.trim();
          const hexMatch = raw.match(/^#?[0-9A-Fa-f]{6}$/);
          if (hexMatch) runOptions.highlight = raw.replace("#", "");
        }
        runs.push({ text, options: runOptions });
        return;
      }
      if (hasChildren(node)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    };

    walk(element);
    return runs;
  }

  // Convert font size mark (px or pt) to points for PptxGenJS
  private parseFontSizeToPoints(value: number | string): number | null {
    if (typeof value === "number") {
      // Heuristic: If value is large (>= 72), assume px and convert to pt
      if (value >= 72) return Math.round((value * 3) / 4);
      return value; // assume pt
    }
    const v = value.trim();
    if (!v) return null;
    const pxMatch = v.match(/^(\d+(?:\.\d+)?)px$/i);
    if (pxMatch) return Math.round((parseFloat(pxMatch[1]!) * 3) / 4);
    const ptMatch = v.match(/^(\d+(?:\.\d+)?)pt$/i);
    if (ptMatch) return parseFloat(ptMatch[1]!);
    const numMatch = v.match(/^(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const n = parseFloat(numMatch[1]!);
      // Default assume pt if no unit
      return n;
    }
    return null;
  }

  private async addBoxes(
    element: TBoxGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    _maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) => {
      const el = child as TElement;
      return (
        el && typeof el === "object" && "type" in el && el.type === "box-item"
      );
    }) as TBoxItemElement[];
    if (items.length === 0) return 0;

    const gap = 0.2;
    const N = items.length;
    const boxWidth = (width - gap * (N - 1)) / N;

    // We do a measurement pass to find the tallest content height
    let maxContentHeight = 1.0;
    for (let i = 0; i < N; i++) {
      const item = items[i]!;
      let itemH = 0;
      for (const child of item.children) {
        const h = await this.processElement(
          child as PlateNode,
          x,
          y,
          boxWidth - 0.3,
          true,
        );
        itemH += h;
      }
      maxContentHeight = Math.max(maxContentHeight, itemH);
    }
    const boxHeight = maxContentHeight + 0.3; // add padding

    if (!measureOnly) {
      for (let i = 0; i < N; i++) {
        const item = items[i]!;
        const boxX = x + i * (boxWidth + gap);

        // Draw native roundRect card
        this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
          x: boxX,
          y: y,
          w: boxWidth,
          h: boxHeight,
          fill: {
            color:
              this.THEME.background === "FFFFFF"
                ? "F5F8F6"
                : this.THEME.background,
          },
          line: { color: this.THEME.accent, width: 1.5 },
        });

        // Render children inside card with padding
        let childY = y + 0.15;
        for (const child of item.children) {
          const childH = await this.processElement(
            child as PlateNode,
            boxX + 0.15,
            childY,
            boxWidth - 0.3,
            false,
            boxHeight - 0.3,
          );
          childY += childH;
        }
      }
    }

    return boxHeight;
  }

  private async addCompare(
    element: TCompareGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    _maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) => {
      const el = child as TElement;
      return (
        el &&
        typeof el === "object" &&
        "type" in el &&
        el.type === "compare-side"
      );
    }) as TCompareSideElement[];
    if (items.length === 0) return 0;

    const gap = 0.25;
    const N = items.length;
    const sideWidth = (width - gap * (N - 1)) / N;

    // Measurement pass
    let maxContentHeight = 1.0;
    for (let i = 0; i < N; i++) {
      const item = items[i]!;
      let itemH = 0;
      for (const child of item.children) {
        const h = await this.processElement(
          child as PlateNode,
          x,
          y,
          sideWidth - 0.3,
          true,
        );
        itemH += h;
      }
      maxContentHeight = Math.max(maxContentHeight, itemH);
    }
    const sideHeight = maxContentHeight + 0.3;

    if (!measureOnly) {
      for (let i = 0; i < N; i++) {
        const item = items[i]!;
        const sideX = x + i * (sideWidth + gap);

        // Draw nice compare card
        this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
          x: sideX,
          y: y,
          w: sideWidth,
          h: sideHeight,
          fill: {
            color:
              this.THEME.background === "FFFFFF"
                ? "FAF9F6"
                : this.THEME.background,
          },
          line: { color: this.THEME.primary, width: 1.5 },
        });

        // Render children inside compare card
        let childY = y + 0.15;
        for (const child of item.children) {
          const childH = await this.processElement(
            child as PlateNode,
            sideX + 0.15,
            childY,
            sideWidth - 0.3,
            false,
            sideHeight - 0.3,
          );
          childY += childH;
        }
      }
    }

    return sideHeight;
  }

  private async addBeforeAfter(
    element: TBeforeAfterGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    _maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) => {
      const el = child as TElement;
      return (
        el &&
        typeof el === "object" &&
        "type" in el &&
        el.type === "before-after-side"
      );
    }) as TBeforeAfterSideElement[];
    if (items.length < 2) return 0;

    const beforeItem = items[0]!;
    const afterItem = items[1]!;

    const cardWidth = (width - 0.8) / 2;

    // Measure heights of both sides
    let beforeHeight = 0;
    for (const child of beforeItem.children) {
      beforeHeight += await this.processElement(
        child as PlateNode,
        x,
        y,
        cardWidth - 0.3,
        true,
      );
    }
    let afterHeight = 0;
    for (const child of afterItem.children) {
      afterHeight += await this.processElement(
        child as PlateNode,
        x,
        y,
        cardWidth - 0.3,
        true,
      );
    }

    const maxContentHeight = Math.max(beforeHeight, afterHeight);
    const cardHeight = maxContentHeight + 0.6; // add margin for title + padding

    if (!measureOnly) {
      const beforeX = x;
      const arrowX = x + cardWidth + 0.15;
      const afterX = x + cardWidth + 0.65;

      // BEFORE Card
      this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
        x: beforeX,
        y: y,
        w: cardWidth,
        h: cardHeight,
        fill: {
          color:
            this.THEME.background === "FFFFFF"
              ? "F9F8F6"
              : this.THEME.background,
        },
        line: { color: this.THEME.accent, width: 1.5 },
      });
      // Title
      this.currentSlide?.addText("BEFORE", {
        x: beforeX + 0.15,
        y: y + 0.1,
        w: cardWidth - 0.3,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: this.THEME.accent,
        align: "left",
      });
      // Render BEFORE children
      let childY = y + 0.45;
      for (const child of beforeItem.children) {
        childY += await this.processElement(
          child as PlateNode,
          beforeX + 0.15,
          childY,
          cardWidth - 0.3,
          false,
          cardHeight - 0.5,
        );
      }

      // Connecting Arrow
      this.currentSlide?.addShape(this.pptx.ShapeType.rightArrow, {
        x: arrowX,
        y: y + cardHeight / 2 - 0.15,
        w: 0.35,
        h: 0.3,
        fill: { color: this.THEME.primary },
      });

      // AFTER Card
      this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
        x: afterX,
        y: y,
        w: cardWidth,
        h: cardHeight,
        fill: {
          color:
            this.THEME.background === "FFFFFF"
              ? "F9F8F6"
              : this.THEME.background,
        },
        line: { color: this.THEME.primary, width: 1.5 },
      });
      // Title
      this.currentSlide?.addText("AFTER", {
        x: afterX + 0.15,
        y: y + 0.1,
        w: cardWidth - 0.3,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: this.THEME.primary,
        align: "left",
      });
      // Render AFTER children
      childY = y + 0.45;
      for (const child of afterItem.children) {
        childY += await this.processElement(
          child as PlateNode,
          afterX + 0.15,
          childY,
          cardWidth - 0.3,
          false,
          cardHeight - 0.5,
        );
      }
    }

    return cardHeight;
  }

  private async addProsCons(
    element: TProsConsGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    _maxHeight?: number,
  ): Promise<number> {
    const prosItem = element.children.find((child) => {
      const el = child as TElement;
      return (
        el && typeof el === "object" && "type" in el && el.type === "pros-item"
      );
    }) as TProsItemElement | undefined;

    const consItem = element.children.find((child) => {
      const el = child as TElement;
      return (
        el && typeof el === "object" && "type" in el && el.type === "cons-item"
      );
    }) as TConsItemElement | undefined;

    const cardWidth = (width - 0.2) / 2;

    let prosHeight = 0;
    if (prosItem) {
      for (const child of prosItem.children) {
        prosHeight += await this.processElement(
          child as PlateNode,
          x,
          y,
          cardWidth - 0.3,
          true,
        );
      }
    }
    let consHeight = 0;
    if (consItem) {
      for (const child of consItem.children) {
        consHeight += await this.processElement(
          child as PlateNode,
          x,
          y,
          cardWidth - 0.3,
          true,
        );
      }
    }

    const maxContentHeight = Math.max(prosHeight, consHeight);
    const cardHeight = maxContentHeight + 0.6; // add margin for header + padding

    if (!measureOnly) {
      const prosX = x;
      const consX = x + cardWidth + 0.2;

      // PROS Card (soft green background)
      this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
        x: prosX,
        y: y,
        w: cardWidth,
        h: cardHeight,
        fill: {
          color: this.THEME.background === "FFFFFF" ? "E8F2EA" : "1E2B21",
        },
        line: { color: "729B7F", width: 1.5 },
      });
      this.currentSlide?.addText("PROS", {
        x: prosX + 0.15,
        y: y + 0.1,
        w: cardWidth - 0.3,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: "4D6B56",
        align: "left",
      });
      if (prosItem) {
        let childY = y + 0.45;
        for (const child of prosItem.children) {
          childY += await this.processElement(
            child as PlateNode,
            prosX + 0.15,
            childY,
            cardWidth - 0.3,
            false,
            cardHeight - 0.5,
          );
        }
      }

      // CONS Card (soft red/coral background)
      this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
        x: consX,
        y: y,
        w: cardWidth,
        h: cardHeight,
        fill: {
          color: this.THEME.background === "FFFFFF" ? "FBEBEB" : "2D1D1D",
        },
        line: { color: "B23B3B", width: 1.5 },
      });
      this.currentSlide?.addText("CONS", {
        x: consX + 0.15,
        y: y + 0.1,
        w: cardWidth - 0.3,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: "B23B3B",
        align: "left",
      });
      if (consItem) {
        let childY = y + 0.45;
        for (const child of consItem.children) {
          childY += await this.processElement(
            child as PlateNode,
            consX + 0.15,
            childY,
            cardWidth - 0.3,
            false,
            cardHeight - 0.5,
          );
        }
      }
    }

    return cardHeight;
  }

  private async addArrowVertical(
    element: TSequenceArrowGroupElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    const items = element.children.filter((child) => {
      const el = child as TElement;
      return (
        el &&
        typeof el === "object" &&
        "type" in el &&
        el.type === "arrow-vertical-item"
      );
    }) as TSequenceArrowItemElement[];
    if (items.length === 0) return 0;

    let currentY = y;
    const yBottom =
      typeof maxHeight === "number" ? y + maxHeight : Number.POSITIVE_INFINITY;

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;

      // Measure box content height
      let contentH = 0;
      for (const child of item.children) {
        contentH += await this.processElement(
          child as PlateNode,
          x,
          y,
          width - 0.4,
          true,
        );
      }
      const boxHeight = contentH + 0.3;

      if (!measureOnly) {
        // Draw card background
        this.currentSlide?.addShape(this.pptx.ShapeType.roundRect, {
          x: x,
          y: currentY,
          w: width,
          h: boxHeight,
          fill: {
            color:
              this.THEME.background === "FFFFFF"
                ? "F9F8F6"
                : this.THEME.background,
          },
          line: { color: this.THEME.primary, width: 1.5 },
        });

        // Render children inside box
        let childY = currentY + 0.15;
        for (const child of item.children) {
          childY += await this.processElement(
            child as PlateNode,
            x + 0.2,
            childY,
            width - 0.4,
            false,
            boxHeight - 0.3,
          );
        }

        // If not last, draw a beautiful connecting down arrow
        if (i < items.length - 1) {
          const arrowY = currentY + boxHeight + 0.05;
          this.currentSlide?.addShape(this.pptx.ShapeType.downArrow, {
            x: x + width / 2 - 0.15,
            y: arrowY,
            w: 0.3,
            h: 0.25,
            fill: { color: this.THEME.accent },
          });
        }
      }

      currentY += boxHeight + 0.35; // include box height + spacing for arrow
      if (currentY > yBottom) break;
    }

    return currentY - y - 0.1; // subtract last arrow offset
  }

  private async addTable(
    element: TTableElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    _maxHeight?: number,
  ): Promise<number> {
    const tableRows = element.children.filter((child) => {
      const el = child as TElement;
      return el && typeof el === "object" && "type" in el && el.type === "tr";
    }) as TTableRowElement[];
    if (tableRows.length === 0) return 0;

    // Calculate maximum columns across all rows to determine colWidth
    let maxCols = 1;
    for (const r of tableRows) {
      const cells = r.children.filter((c) => {
        const el = c as TElement;
        return (
          el &&
          typeof el === "object" &&
          "type" in el &&
          (el.type === "td" || el.type === "th")
        );
      });
      maxCols = Math.max(maxCols, cells.length);
    }
    const colWidth = width / maxCols;

    // Dynamically calculate row heights cell-by-cell
    let totalTableHeight = 0;
    const rowHeights: number[] = [];
    for (const r of tableRows) {
      const cells = r.children.filter((c) => {
        const el = c as TElement;
        return (
          el &&
          typeof el === "object" &&
          "type" in el &&
          (el.type === "td" || el.type === "th")
        );
      }) as TTableCellElement[];

      let maxCellHeight = 0.35; // Absolute minimum row height in inches
      for (const c of cells) {
        const cellText = this.extractText(c);
        // Estimate text wrapping height with 10pt font size
        const cellHeight = this.estimateTextHeight(cellText, colWidth, 10);
        if (cellHeight > maxCellHeight) {
          maxCellHeight = cellHeight;
        }
      }
      rowHeights.push(maxCellHeight);
      totalTableHeight += maxCellHeight;
    }

    if (measureOnly) return totalTableHeight;

    const tableData: PptxGenJS.TableCell[][] = [];

    for (let rIdx = 0; rIdx < tableRows.length; rIdx++) {
      const r = tableRows[rIdx]!;
      const rowCells: PptxGenJS.TableCell[] = [];
      const cells = r.children.filter((c) => {
        const el = c as TElement;
        return (
          el &&
          typeof el === "object" &&
          "type" in el &&
          (el.type === "td" || el.type === "th")
        );
      }) as TTableCellElement[];
      for (const c of cells) {
        const cellText = this.extractText(c);
        const isHeader = (c as any).type === "th";
        rowCells.push({
          text: cellText,
          options: {
            fill: {
              color: isHeader
                ? this.THEME.primary
                : this.THEME.background === "FFFFFF"
                  ? "F9F8F6"
                  : this.THEME.background,
            },
            color: isHeader ? "FFFFFF" : this.THEME.text,
            bold: isHeader,
            fontSize: 10,
            align: "center",
            valign: "middle",
            margin: [4, 6, 4, 6], // Elegant cell padding
            border: {
              type: "solid",
              color: this.THEME.muted || "CCCCCC",
              pt: 1,
            },
          },
        });
      }
      tableData.push(rowCells);
    }

    this.currentSlide?.addTable(tableData, {
      x: x,
      y: y,
      w: width,
      h: totalTableHeight,
      rowH: rowHeights,
    });

    return totalTableHeight;
  }

  private async addChart(
    element: TChartElement,
    x: number,
    y: number,
    width: number,
    measureOnly = false,
    maxHeight?: number,
  ): Promise<number> {
    let chartHeight = 2.8;
    if (typeof maxHeight === "number")
      chartHeight = Math.min(chartHeight, Math.max(1.5, maxHeight));
    if (measureOnly) return chartHeight;

    const customChart = element as unknown as CustomChartElement;
    const data = customChart.data || [];
    const elementType = element.type;

    let chartTypeSelected = this.pptx.ChartType.bar;
    if (elementType === "chart-pie")
      chartTypeSelected = this.pptx.ChartType.pie;
    else if (elementType === "chart-line")
      chartTypeSelected = this.pptx.ChartType.line;
    else if (elementType === "chart-area")
      chartTypeSelected = this.pptx.ChartType.area;
    else if (elementType === "chart-radar")
      chartTypeSelected = this.pptx.ChartType.radar;
    else if (elementType === "chart-scatter")
      chartTypeSelected = this.pptx.ChartType.scatter;

    let chartData: any[] = [];
    if (elementType === "chart-scatter") {
      chartData = [
        {
          name: "X Values",
          values: data.map((d) => d.x || 0),
        },
        {
          name: "Y Values",
          values: data.map((d) => d.y || 0),
        },
      ];
    } else {
      chartData = [
        {
          name: "Series 1",
          labels: data.map((d) => d.label || ""),
          values: data.map((d) => d.value || 0),
        },
      ];
    }

    this.currentSlide?.addChart(chartTypeSelected, chartData, {
      x: x,
      y: y,
      w: width,
      h: chartHeight,
      showLegend: true,
      showTitle: false,
    });

    return chartHeight;
  }

  private getCycleColor(index: number): string {
    const colors = ["4472C4", "70AD47", "FFC000", "C5504B"];
    return colors[index % colors.length] ?? "4472C4";
  }
}

// Usage function
export async function convertPlateJSToPPTX(
  presentationData: PresentationData,
  theme?: Partial<ThemeColors>,
): Promise<ArrayBuffer> {
  const converter = new PlateJSToPPTXConverter(theme);
  const pptx = await converter.convertToPPTX(presentationData);
  const output = await pptx.write({ outputType: "arraybuffer" });
  // Type guards: library type says it can be string | ArrayBuffer | Blob | Uint8Array
  if (output instanceof ArrayBuffer) return output;
  if (output instanceof Uint8Array) {
    const view = output;
    const ab = new ArrayBuffer(view.byteLength);
    new Uint8Array(ab).set(view);
    return ab;
  }
  if (typeof output === "string") {
    // base64 or binarystring; convert to ArrayBuffer
    const view = new TextEncoder().encode(output);
    const ab = new ArrayBuffer(view.byteLength);
    new Uint8Array(ab).set(view);
    return ab;
  }
  // Blob fallback
  const arrayBuf = await (output as Blob).arrayBuffer();
  return arrayBuf;
}
