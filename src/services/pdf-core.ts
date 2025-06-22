// pdf-core.ts

import { PDFDocument, rgb, StandardFonts, PageSizes, degrees, PDFFont } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfWorker";
import { nanoid } from "nanoid";
// (Add or merge other imports as needed)

type PDFPageProxy = any;

// --------- TYPE DEFINITIONS ----------
export interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  text?: string;
  font: string;
  fontFamily?: string;
  size: number;
  fontSize?: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontWeight?: string;
  fontStyle?: string;
}

export interface Annotation {
  id: string;
  type: "highlight" | "rectangle" | "circle" | "freeform" | "signature" | "text" | "checkmark" | "x-mark" | "line" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  page: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  src?: string;
}

export interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  rect: number[];
  value: string;
  options?: string[];
  radioGroup?: string;
  page: number;
  required?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  from: {
    name: string;
    address: string[];
    email?: string;
    phone?: string;
  };
  to: {
    name: string;
    address: string[];
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: {
    rate: number;
    amount: number;
  };
  total: number;
  notes?: string;
  paymentTerms?: string;
}

export interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

export interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
  fileUrl?: string;
}

// --------- PDFCoreService Class -----------
export class PDFCoreService {
  private static instance: PDFCoreService;

  static getInstance(): PDFCoreService {
    if (!PDFCoreService.instance) {
      PDFCoreService.instance = new PDFCoreService();
    }
    return PDFCoreService.instance;
  }

  // ----------- Font Library/Detection System (formerly loadFonts.ts) -----------

  private fonts: FontInfo[] = [
  { name: "Arial", family: "Arial", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/arial.ttf" },
  { name: "Helvetica", family: "Helvetica", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/helvetica.ttf" },
  { name: "Times New Roman", family: "Times New Roman", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/times-new-roman.ttf" },
  { name: "Courier New", family: "Courier New", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/courier-new.ttf" },
  { name: "Verdana", family: "Verdana", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/verdana.ttf" },
  { name: "Georgia", family: "Georgia", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/georgia.ttf" },
  { name: "Trebuchet MS", family: "Trebuchet MS", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/trebuchet-ms.ttf" },
  { name: "Tahoma", family: "Tahoma", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/tahoma.ttf" },
  { name: "Impact", family: "Impact", style: "normal", weight: "bold", loaded: true, fileUrl: "/fonts/impact.ttf" },
  { name: "Comic Sans MS", family: "Comic Sans MS", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/comic-sans-ms.ttf" },
  { name: "Roboto", family: "Roboto", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/roboto.ttf" },
  { name: "Open Sans", family: "Open Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/open-sans.ttf" },
  { name: "Lato", family: "Lato", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/lato.ttf" },
  { name: "Montserrat", family: "Montserrat", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/montserrat.ttf" },
  { name: "Oswald", family: "Oswald", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/oswald.ttf" },
  { name: "Raleway", family: "Raleway", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/raleway.ttf" },
  { name: "PT Sans", family: "PT Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/pt-sans.ttf" },
  { name: "Source Sans Pro", family: "Source Sans Pro", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/source-sans-pro.ttf" },
  { name: "Merriweather", family: "Merriweather", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/merriweather.ttf" },
  { name: "Noto Sans", family: "Noto Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/noto-sans.ttf" },
  { name: "Ubuntu", family: "Ubuntu", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/ubuntu.ttf" },
  { name: "Nunito", family: "Nunito", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/nunito.ttf" },
  { name: "Work Sans", family: "Work Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/work-sans.ttf" },
  { name: "Rubik", family: "Rubik", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/rubik.ttf" },
  { name: "Poppins", family: "Poppins", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/poppins.ttf" },
  { name: "Inter", family: "Inter", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/inter.ttf" },
  { name: "Fira Sans", family: "Fira Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/fira-sans.ttf" },
  { name: "Cabin", family: "Cabin", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/cabin.ttf" },
  { name: "Playfair Display", family: "Playfair Display", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/playfair-display.ttf" },
  { name: "Titillium Web", family: "Titillium Web", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/titillium-web.ttf" },
  { name: "Inconsolata", family: "Inconsolata", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/inconsolata.ttf" },
  { name: "IBM Plex Sans", family: "IBM Plex Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/ibm-plex-sans.ttf" },
  { name: "Quicksand", family: "Quicksand", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/quicksand.ttf" },
  { name: "Assistant", family: "Assistant", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/assistant.ttf" },
  { name: "Mukta", family: "Mukta", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/mukta.ttf" },
  { name: "Arimo", family: "Arimo", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/arimo.ttf" },
  { name: "Karla", family: "Karla", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/karla.ttf" },
  { name: "Josefin Sans", family: "Josefin Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/josefin-sans.ttf" },
  { name: "Manrope", family: "Manrope", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/manrope.ttf" },
  { name: "Zilla Slab", family: "Zilla Slab", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/zilla-slab.ttf" },
  { name: "Space Grotesk", family: "Space Grotesk", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/space-grotesk.ttf" },
  { name: "Barlow", family: "Barlow", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/barlow.ttf" },
  { name: "Cairo", family: "Cairo", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/cairo.ttf" },
  { name: "DM Sans", family: "DM Sans", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/dm-sans.ttf" },
  { name: "Mulish", family: "Mulish", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/mulish.ttf" },
  { name: "Heebo", family: "Heebo", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/heebo.ttf" },
  { name: "Exo 2", family: "Exo 2", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/exo-2.ttf" },
  { name: "Be Vietnam Pro", family: "Be Vietnam Pro", style: "normal", weight: "normal", loaded: true, fileUrl: "/fonts/be-vietnam-pro.ttf" },
  { name: "Anton", family: "Anton", style: "normal", weight: "bold", loaded: true, fileUrl: "/fonts/anton.ttf" }, 
  ];

  // Returns all known font names
  getAvailableFontNames(): string[] {
    return this.fonts.map(f => f.name);
  }

  // Returns all FontInfo objects
  getAvailableFonts(): FontInfo[] {
    return this.fonts;
  }

  // Finds font path (if you host fonts somewhere or in public dir, customize this as needed)
  getFontPath(fontName: string): string | undefined {
    // Example: fonts hosted at "/fonts/" in your public directory
    const found = this.fonts.find(f => f.name === fontName);
    if (found && found.fileUrl) return found.fileUrl;
    // Default mapping example:
    return `/fonts/${fontName.replace(/\s+/g, "-").toLowerCase()}.ttf`;
  }

  // Checks if a font is available in the known list
  isFontAvailable(fontName: string): boolean {
    return this.fonts.some(f => f.name === fontName);
  }

  // Loads/detects fonts in a PDF file (very basic—expand with pdf.js font detection if needed)
  async loadFonts(arrayBuffer: ArrayBuffer): Promise<FontInfo[]> {
    // TODO: For real font extraction, you may need to use pdfjsLib or a proper font detection method.
    // Here’s a placeholder that simply returns the standard font list (you can expand this logic).
    return this.fonts;
  }

  // --------- The rest of your PDFCoreService ---------

  async loadPDF(file: File | ArrayBuffer): Promise<any> {
    const data = file instanceof File ? await file.arrayBuffer() : file;
    return await pdfjsLib.getDocument({ data }).promise;
  }

  async renderPage(
    pdfDoc: any,
    pageNum: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ): Promise<void> {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas context not available");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
  }

  async detectFormFields(pdfDoc: any, pageNum: number): Promise<FormField[]> {
    const page = await pdfDoc.getPage(pageNum);
    const annotations = await page.getAnnotations();

    return annotations
      .filter((a: any) => a.subtype === "Widget")
      .map((a: any, index: number) => ({
        id: a.id || `field_${pageNum}_${index}`,
        fieldName: a.fieldName || `field_${pageNum}_${index}`,
        fieldType: a.fieldType,
        rect: a.rect,
        x: a.rect[0],
        y: a.rect[1],
        width: a.rect[2] - a.rect[0],
        height: a.rect[3] - a.rect[1],
        value: a.fieldValue || a.buttonValue || "",
        options: a.options || [],
        radioGroup: a.radioButton ? a.fieldName : undefined,
        page: pageNum,
        required: a.required || false,
      }));
  }

  async extractTextContent(pdfDoc: any, pageNum?: number): Promise<string> {
    let allText = "";
    const numPages = pageNum ? 1 : pdfDoc.numPages;
    const startPage = pageNum || 1;
    const endPage = pageNum || pdfDoc.numPages;

    for (let i = startPage; i <= endPage; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");

      allText += pageText + "\n";
    }

    return allText.trim();
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  }

  async getFontForFamily(pdfDoc: PDFDocument, fontFamily: string): Promise<PDFFont> {
    const fontMap: { [key: string]: any } = {
      Helvetica: StandardFonts.Helvetica,
      Arial: StandardFonts.Helvetica,
      Times: StandardFonts.TimesRoman,
      "Times-Roman": StandardFonts.TimesRoman,
      "Times New Roman": StandardFonts.TimesRoman,
      Courier: StandardFonts.Courier,
      "Courier New": StandardFonts.Courier,
      Georgia: StandardFonts.TimesRoman,
      Verdana: StandardFonts.Helvetica,
    };

    const standardFont = fontMap[fontFamily] || StandardFonts.Helvetica;
    return await pdfDoc.embedFont(standardFont);
  }

  async addTextElementsToPDF(
    pdfData: ArrayBuffer,
    textElements: TextBox[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const element of textElements) {
      const page = pages[element.page - 1];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();
      const font = await this.getFontForFamily(
        pdfDoc,
        element.fontFamily || element.font || "Helvetica"
      );
      const color = this.hexToRgb(element.color);

      const fontSize = element.fontSize || element.size || 16;
      const x = element.x;
      const y = pageHeight - element.y - fontSize;

      page.drawText(element.text || element.value || "", {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        rotate: degrees(0),
      });
    }

    return await pdfDoc.save();
  }

  async fillFormFields(
    pdfData: ArrayBuffer,
    formFields: FormField[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const form = pdfDoc.getForm();

    for (const field of formFields) {
      try {
        switch (field.fieldType) {
          case "Tx":
            const textField = form.getTextField(field.fieldName);
            textField.setText(String(field.value));
            break;

          case "Btn":
            if (field.radioGroup) {
              const radioGroup = form.getRadioGroup(field.radioGroup);
              if (field.value === "Yes") {
                radioGroup.select(field.fieldName);
              }
            } else {
              const checkBox = form.getCheckBox(field.fieldName);
              if (field.value === "Yes") {
                checkBox.check();
              } else {
                checkBox.uncheck();
              }
            }
            break;

          case "Ch":
            const dropdown = form.getDropdown(field.fieldName);
            dropdown.select(String(field.value));
            break;
        }
      } catch (error) {
        console.warn(`Failed to fill field ${field.fieldName}:`, error);
      }
    }

    form.flatten();
    return await pdfDoc.save();
  }

  async addAnnotationsToPDF(
    pdfData: ArrayBuffer,
    annotations: Annotation[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const annotation of annotations) {
      const page = pages[annotation.page - 1];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();
      const color = this.hexToRgb(annotation.color);
      const y = pageHeight - annotation.y - annotation.height;

      switch (annotation.type) {
        case "rectangle":
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2,
          });
          break;

        case "circle":
          page.drawEllipse({
            x: annotation.x + annotation.width / 2,
            y: y + annotation.height / 2,
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2,
          });
          break;

        case "highlight":
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            color: rgb(color.r, color.g, color.b),
            opacity: 0.3,
            borderColor: rgb(color.r, color.g, color.b),
          });
          break;

        case "freeform":
        case "signature":
          if (annotation.points && annotation.points.length > 2) {
            for (let i = 0; i < annotation.points.length - 2; i += 2) {
              const x1 = annotation.points[i];
              const y1 = pageHeight - annotation.points[i + 1];
              const x2 = annotation.points[i + 2];
              const y2 = pageHeight - annotation.points[i + 3];

              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                color: rgb(color.r, color.g, color.b),
                thickness: annotation.strokeWidth || 2,
              });
            }
          }

          // For signature type with image data
          if (annotation.type === "signature" && annotation.src) {
            try {
              // Convert data URL to image and embed
              const response = await fetch(annotation.src);
              const imageBytes = await response.arrayBuffer();
              const image = await pdfDoc.embedPng(new Uint8Array(imageBytes));

              page.drawImage(image, {
                x: annotation.x,
                y,
                width: annotation.width,
                height: annotation.height,
              });
            } catch (error) {
              console.warn("Failed to embed signature image:", error);
            }
          }
          break;

        case "text":
          if (annotation.text) {
            const font = await this.getFontForFamily(pdfDoc, "Helvetica");
            const fontSize = annotation.fontSize || 16;

            page.drawText(annotation.text, {
              x: annotation.x,
              y: y + fontSize,
              size: fontSize,
              font,
              color: rgb(color.r, color.g, color.b),
            });
          }
          break;
      }
    }

    return await pdfDoc.save();
  }

  async mergePDFs(pdfFiles: ArrayBuffer[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfData of pdfFiles) {
      const pdf = await PDFDocument.load(pdfData);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  async splitPDF(pdfData: ArrayBuffer, pageRanges: number[][]): Promise<Uint8Array[]> {
    const originalPdf = await PDFDocument.load(pdfData);
    const splitPdfs: Uint8Array[] = [];

    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = range.map((pageNum) => pageNum - 1);
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      splitPdfs.push(pdfBytes);
    }

    return splitPdfs;
  }

  async rotatePDF(
    pdfData: ArrayBuffer,
    pageNum: number,
    degreesValue: number
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];

    if (page) {
      page.setRotation(degrees(degreesValue));
    }

    return await pdfDoc.save();
  }

  async compressPDF(pdfData: ArrayBuffer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    return await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async exportWithAllElements(
    originalPdfData: ArrayBuffer,
    textElements: TextBox[],
    formFields: FormField[],
    annotations: Annotation[]
  ): Promise<Uint8Array> {
    let pdfBytes: Uint8Array = new Uint8Array(originalPdfData);

    // Helper to force ArrayBuffer for PDF-lib functions
    const getArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
      // Make a new ArrayBuffer and copy contents (works in all runtimes)
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);
      return ab;
    };

    if (textElements.length > 0) {
      pdfBytes = await this.addTextElementsToPDF(getArrayBuffer(pdfBytes), textElements);
    }

    if (formFields.length > 0) {
      pdfBytes = await this.fillFormFields(getArrayBuffer(pdfBytes), formFields);
    }

    if (annotations.length > 0) {
      pdfBytes = await this.addAnnotationsToPDF(getArrayBuffer(pdfBytes), annotations);
    }

    return pdfBytes;
  }

  // Generate invoice
  async generateInvoice(invoiceData: InvoiceData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPos = height - 50;

    // Header
    page.drawText("INVOICE", {
      x: 50,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Invoice #: ${invoiceData.invoiceNumber}`, {
      x: width - 200,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });

    yPos -= 20;
    page.drawText(`Date: ${invoiceData.date}`, {
      x: width - 200,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });

    if (invoiceData.dueDate) {
      yPos -= 15;
      page.drawText(`Due Date: ${invoiceData.dueDate}`, {
        x: width - 200,
        y: yPos,
        size: 12,
        font: helveticaFont,
      });
    }

    yPos -= 40;

    // From section
    page.drawText("From:", {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
    });

    yPos -= 20;
    page.drawText(invoiceData.from.name, {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });

    yPos -= 15;
    invoiceData.from.address.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaFont,
      });
      yPos -= 12;
    });

    // To section
    yPos = height - 170;
    page.drawText("To:", {
      x: 300,
      y: yPos,
      size: 12,
      font: helveticaBold,
    });

    yPos -= 20;
    page.drawText(invoiceData.to.name, {
      x: 300,
      y: yPos,
      size: 12,
      font: helveticaFont,
    });

    yPos -= 15;
    invoiceData.to.address.forEach((line) => {
      page.drawText(line, {
        x: 300,
        y: yPos,
        size: 10,
        font: helveticaFont,
      });
      yPos -= 12;
    });

    // Items table
    yPos = height - 300;

    // Table header
    page.drawRectangle({
      x: 50,
      y: yPos - 20,
      width: width - 100,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("Description", { x: 60, y: yPos - 15, size: 10, font: helveticaBold });
    page.drawText("Qty", { x: 350, y: yPos - 15, size: 10, font: helveticaBold });
    page.drawText("Rate", { x: 400, y: yPos - 15, size: 10, font: helveticaBold });
    page.drawText("Amount", { x: 480, y: yPos - 15, size: 10, font: helveticaBold });

    yPos -= 25;

    // Items
    invoiceData.items.forEach((item) => {
      page.drawText(item.description, { x: 60, y: yPos, size: 10, font: helveticaFont });
      page.drawText(item.quantity.toString(), { x: 360, y: yPos, size: 10, font: helveticaFont });
      page.drawText(`$${item.rate.toFixed(2)}`, { x: 400, y: yPos, size: 10, font: helveticaFont });
      page.drawText(`$${item.amount.toFixed(2)}`, { x: 480, y: yPos, size: 10, font: helveticaFont });
      yPos -= 20;
    });

    // Totals
    yPos -= 20;
    page.drawText(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, {
      x: 400,
      y: yPos,
      size: 10,
      font: helveticaFont,
    });

    if (invoiceData.tax) {
      yPos -= 15;
      page.drawText(`Tax (${invoiceData.tax.rate}%): $${invoiceData.tax.amount.toFixed(2)}`, {
        x: 400,
        y: yPos,
        size: 10,
        font: helveticaFont,
      });
    }

    yPos -= 20;
    page.drawText(`Total: $${invoiceData.total.toFixed(2)}`, {
      x: 400,
      y: yPos,
      size: 12,
      font: helveticaBold,
    });

    return await pdfDoc.save();
  }
}

// Singleton export
const pdfCore = PDFCoreService.getInstance();
export default pdfCore;
