import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { 
  PDFFile, 
  TextElement, 
  FormField,  
  Annotation,
  RGBColor,
  FontInfo 
} from '../types/pdf-types';

// Utility function to get ArrayBuffer from Uint8Array
function getArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer instanceof ArrayBuffer &&
    u8.byteOffset === 0 &&
    u8.byteLength === u8.buffer.byteLength
    ? u8.buffer
    : u8.slice().buffer;
}

export class PDFCoreService {
  private static instance: PDFCoreService;
  private workerInitialized = false;

  static getInstance(): PDFCoreService {
    if (!PDFCoreService.instance) {
      PDFCoreService.instance = new PDFCoreService();
    }
    return PDFCoreService.instance;
  }

  // ========== Worker Initialization ==========
  async initializeWorker(): Promise<void> {
    if (this.workerInitialized) return;
    
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    this.workerInitialized = true;
  }

  // ========== PDF Loading and Rendering ==========
  async loadPDF(file: File | ArrayBuffer): Promise<any> {
    await this.initializeWorker();
    
    const data = file instanceof File ? await file.arrayBuffer() : file;
    return await pdfjs.getDocument({ data }).promise;
  }

  async renderPage(
    pdfDoc: any, 
    pageNum: number, 
    canvas: HTMLCanvasElement, 
    scale: number = 1.5
  ): Promise<void> {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
  }

  // ========== Text Content Extraction ==========
  async extractTextContent(pdfDoc: any, pageNum?: number): Promise<string> {
    let allText = '';
    const numPages = pageNum ? 1 : pdfDoc.numPages;
    const startPage = pageNum || 1;
    const endPage = pageNum || pdfDoc.numPages;

    for (let i = startPage; i <= endPage; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      allText += pageText + '\n';
    }

    return allText.trim();
  }

  // ========== Form Field Detection ==========
  async detectFormFields(pdfDoc: any, pageNum: number): Promise<FormField[]> {
    const page = await pdfDoc.getPage(pageNum);
    const annotations = await page.getAnnotations();
    
    return annotations
      .filter((a: any) => a.subtype === "Widget")
      .map((a: any, index: number) => ({
        id: a.id || `field_${pageNum}_${index}`,
        fieldName: a.fieldName || `field_${pageNum}_${index}`,
        name: a.fieldName || `field_${pageNum}_${index}`,
        type: this.mapFieldType(a.fieldType),
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
        required: a.required || false
      }));
  }

  private mapFieldType(pdfFieldType: string): "text" | "checkbox" | "radio" | "dropdown" | "signature" {
    switch (pdfFieldType) {
      case 'Tx': return 'text';
      case 'Btn': return 'checkbox';
      case 'Ch': return 'dropdown';
      case 'Sig': return 'signature';
      default: return 'text';
    }
  }

  // ========== Font Management ==========
  async getFontForFamily(pdfDoc: PDFDocument, fontFamily: string): Promise<PDFFont> {
    const fontMap: { [key: string]: any } = {
      'Helvetica': StandardFonts.Helvetica,
      'Arial': StandardFonts.Helvetica,
      'Times': StandardFonts.TimesRoman,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times New Roman': StandardFonts.TimesRoman,
      'Courier': StandardFonts.Courier,
      'Courier New': StandardFonts.Courier,
      'Georgia': StandardFonts.TimesRoman,
      'Verdana': StandardFonts.Helvetica
    };

    const standardFont = fontMap[fontFamily] || StandardFonts.Helvetica;
    return await pdfDoc.embedFont(standardFont);
  }

  // ========== Color Utilities ==========
  hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  // ========== Text Element Operations ==========
  async addTextElementsToPDF(
    pdfData: ArrayBuffer,
    textElements: TextElement[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const element of textElements) {
      const page = pages[element.page - 1];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();
      const font = await this.getFontForFamily(pdfDoc, element.fontFamily || element.font || 'Helvetica');
      const color = this.hexToRgb(element.color);

      const fontSize = element.fontSize || element.size || 16;
      const x = element.x;
      const y = pageHeight - element.y - fontSize;

      page.drawText(element.text || element.value || '', {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        rotate: degrees(element.rotation || 0)
      });
    }

    return await pdfDoc.save();
  }

  // ========== Form Field Operations ==========
  async fillFormFields(
    pdfData: ArrayBuffer,
    formFields: FormField[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const form = pdfDoc.getForm();

    for (const field of formFields) {
      try {
        switch (field.fieldType) {
          case 'Tx': // Text field
            const textField = form.getTextField(field.fieldName);
            textField.setText(String(field.value));
            break;
          
          case 'Btn': // Button/Checkbox
            if (field.radioGroup) {
              const radioGroup = form.getRadioGroup(field.radioGroup);
              if (field.value === 'Yes' || field.value === true) {
                radioGroup.select(field.fieldName);
              }
            } else {
              const checkBox = form.getCheckBox(field.fieldName);
              if (field.value === 'Yes' || field.value === true) {
                checkBox.check();
              } else {
                checkBox.uncheck();
              }
            }
            break;
          
          case 'Ch': // Choice field (dropdown)
            const dropdown = form.getDropdown(field.fieldName);
            dropdown.select(String(field.value));
            break;
        }
      } catch (error) {
        console.warn(`Failed to fill field ${field.fieldName}:`, error);
      }
    }

    // Flatten the form to make it non-editable
    form.flatten();
    return await pdfDoc.save();
  }

  // ========== Annotation Operations ==========
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
        case 'rectangle':
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2
          });
          break;

        case 'circle':
          page.drawEllipse({
            x: annotation.x + annotation.width / 2,
            y: y + annotation.height / 2,
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2
          });
          break;

        case 'highlight':
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            color: rgb(color.r, color.g, color.b),
            opacity: 0.3,
            borderColor: rgb(color.r, color.g, color.b)
          });
          break;

        case 'freeform':
        case 'signature':
          // Handle freeform drawings with points
          if ('points' in annotation && annotation.points && annotation.points.length > 2) {
            // For complex paths, we'll draw lines between points
            for (let i = 0; i < annotation.points.length - 2; i += 2) {
              const x1 = annotation.points[i];
              const y1 = pageHeight - annotation.points[i + 1];
              const x2 = annotation.points[i + 2];
              const y2 = pageHeight - annotation.points[i + 3];
              
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                color: rgb(color.r, color.g, color.b),
                thickness: annotation.strokeWidth || 2
              });
            }
          }
          break;

        case 'text':
          if ('text' in annotation && annotation.text) {
            const font = await this.getFontForFamily(pdfDoc, 'Helvetica');
            const fontSize = 'fontSize' in annotation ? annotation.fontSize || 16 : 16;
            
            page.drawText(annotation.text, {
              x: annotation.x,
              y: y + fontSize,
              size: fontSize,
              font,
              color: rgb(color.r, color.g, color.b)
            });
          }
          break;
      }
    }

    return await pdfDoc.save();
  }

  // ========== PDF Manipulation Operations ==========
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
      const pageIndices = range.map(pageNum => pageNum - 1); // Convert to 0-based
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      splitPdfs.push(pdfBytes);
    }

    return splitPdfs;
  }

  async rotatePDF(pdfData: ArrayBuffer, pageNum: number, degreesValue: number): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];
    
    if (page) {
      page.setRotation(degrees(degreesValue));
    }
  
    return await pdfDoc.save();
  }

  async compressPDF(pdfData: ArrayBuffer): Promise<Uint8Array> {
    // Basic compression by re-saving the PDF
    const pdfDoc = await PDFDocument.load(pdfData);
    return await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
  }

  // ========== Export Operations ==========
  async exportWithAllElements(
    originalPdfData: ArrayBuffer,
    textElements: TextElement[],
    formFields: FormField[],
    annotations: Annotation[]

  ): Promise<Uint8Array> {
    let pdfBytes: Uint8Array = new Uint8Array(originalPdfData);

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

  // ========== Utility Operations ==========
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
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
}

// Export singleton instance
export const pdfCore = PDFCoreService.getInstance();
