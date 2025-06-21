import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';

// Merged functionality from pdfUtils.ts, livePdfProcessor.js, pageTools.js, pdfFormFiller.js, pdfInvoiceGenerator.js

export interface PDFMergeOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}

export interface PDFSplitOptions {
  outputFormat?: 'separate' | 'range';
  pageRanges?: Array<{ start: number; end: number }>;
  prefix?: string;
}

export interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  value: string | boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
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

export interface TextElement {
  text: string;
  x: number;
  y: number;
  size: number;
  color: { r: number; g: number; b: number };
  font?: string;
  page: number;
}

export interface AnnotationElement {
  type: 'rectangle' | 'circle' | 'line' | 'highlight';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: { r: number; g: number; b: number };
  strokeWidth: number;
  page: number;
}

// PDF Merging Utilities
export async function mergePDFs(pdfFiles: File[], options: PDFMergeOptions = {}): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  // Set metadata
  if (options.title) mergedPdf.setTitle(options.title);
  if (options.author) mergedPdf.setAuthor(options.author);
  if (options.subject) mergedPdf.setSubject(options.subject);
  if (options.keywords) mergedPdf.setKeywords(options.keywords);
  if (options.creator) mergedPdf.setCreator(options.creator);
  mergedPdf.setCreationDate(new Date());
  mergedPdf.setModificationDate(new Date());

  for (const file of pdfFiles) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.error(`Error merging PDF ${file.name}:`, error);
      throw new Error(`Failed to merge PDF: ${file.name}`);
    }
  }

  return mergedPdf.save();
}

// PDF Splitting Utilities
export async function extractPagesFromPdf(
  pdfFile: File, 
  pageNumbers: number[], 
  options: PDFSplitOptions = {}
): Promise<Uint8Array[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const results: Uint8Array[] = [];

  if (options.outputFormat === 'range' && options.pageRanges) {
    // Extract page ranges
    for (const range of options.pageRanges) {
      const newPdf = await PDFDocument.create();
      const pages:  number[] = [];
      
      for (let i = range.start - 1; i < range.end && i < sourcePdf.getPageCount(); i++) {
        pages.push(i);
      }
      
      const copiedPages = await newPdf.copyPages(sourcePdf, pages);
      copiedPages.forEach(page => newPdf.addPage(page));
      
      results.push(await newPdf.save());
    }
  } else {
    // Extract individual pages
    for (const pageNum of pageNumbers) {
      if (pageNum > 0 && pageNum <= sourcePdf.getPageCount()) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);
        results.push(await newPdf.save());
      }
    }
  }

  return results;
}

// Form Filling Utilities
export async function fillPDFForm(pdfFile: File, formData: Record<string, any>): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const form = pdfDoc.getForm();

  // Fill text fields
  for (const [fieldName, value] of Object.entries(formData)) {
    try {
      const field = form.getField(fieldName);
      
      if (field.constructor.name === 'PDFTextField') {
        const textField = field as any;
        textField.setText(String(value));
      } else if (field.constructor.name === 'PDFCheckBox') {
        const checkBox = field as any;
        if (value) checkBox.check();
        else checkBox.uncheck();
      } else if (field.constructor.name === 'PDFDropdown') {
        const dropdown = field as any;
        dropdown.select(String(value));
      } else if (field.constructor.name === 'PDFRadioGroup') {
        const radioGroup = field as any;
        radioGroup.select(String(value));
      }
    } catch (error) {
      console.warn(`Could not fill field ${fieldName}:`, error);
    }
  }

  // Optionally flatten the form to prevent further editing
  form.flatten();

  return pdfDoc.save();
}

// Custom form field creation
export async function addFormFieldsToPDF(
  pdfFile: File, 
  fields: FormField[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const field of fields) {
    if (field.page > pages.length) continue;
    
    const page = pages[field.page - 1];
    const { height } = page.getSize();

    // Convert coordinates (PDF coordinates are bottom-up)
    const yPos = height - field.y - field.height;

    switch (field.type) {
      case 'text':
        // Draw text field background
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1)
        });
        
        // Add text if value exists
        if (typeof field.value === 'string' && field.value) {
          page.drawText(field.value, {
            x: field.x + 5,
            y: yPos + field.height / 2 - 6,
            size: 12,
            color: rgb(0, 0, 0)
          });
        }
        break;

      case 'checkbox':
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1)
        });
        
        if (field.value === true) {
          page.drawText('✓', {
            x: field.x + field.width / 2 - 6,
            y: yPos + field.height / 2 - 6,
            size: 14,
            color: rgb(0, 0, 0)
          });
        }
        break;

      case 'signature':
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
          color: rgb(0.98, 0.98, 0.98)
        });
        
        page.drawText('Signature', {
          x: field.x + 5,
          y: yPos + field.height / 2 - 6,
          size: 10,
          color: rgb(0.5, 0.5, 0.5)
        });
        break;
    }
  }

  return pdfDoc.save();
}

// Invoice Generation
export async function generateInvoice(invoiceData: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPos = height - 50;

  // Header
  page.drawText('INVOICE', {
    x: 50,
    y: yPos,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Invoice #: ${invoiceData.invoiceNumber}`, {
    x: width - 200,
    y: yPos,
    size: 12,
    font: helveticaFont
  });

  yPos -= 20;
  page.drawText(`Date: ${invoiceData.date}`, {
    x: width - 200,
    y: yPos,
    size: 12,
    font: helveticaFont
  });

  if (invoiceData.dueDate) {
    yPos -= 15;
    page.drawText(`Due Date: ${invoiceData.dueDate}`, {
      x: width - 200,
      y: yPos,
      size: 12,
      font: helveticaFont
    });
  }

  yPos -= 40;

  // From section
  page.drawText('From:', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBold
  });

  yPos -= 20;
  page.drawText(invoiceData.from.name, {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaFont
  });

  yPos -= 15;
  invoiceData.from.address.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helveticaFont
    });
    yPos -= 12;
  });

  // To section
  yPos = height - 170;
  page.drawText('To:', {
    x: 300,
    y: yPos,
    size: 12,
    font: helveticaBold
  });

  yPos -= 20;
  page.drawText(invoiceData.to.name, {
    x: 300,
    y: yPos,
    size: 12,
    font: helveticaFont
  });

  yPos -= 15;
  invoiceData.to.address.forEach(line => {
    page.drawText(line, {
      x: 300,
      y: yPos,
      size: 10,
      font: helveticaFont
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
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawText('Description', { x: 60, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText('Qty', { x: 350, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText('Rate', { x: 400, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText('Amount', { x: 480, y: yPos - 15, size: 10, font: helveticaBold });

  yPos -= 25;

  // Items
  invoiceData.items.forEach(item => {
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
    font: helveticaFont
  });

  if (invoiceData.tax) {
    yPos -= 15;
    page.drawText(`Tax (${invoiceData.tax.rate}%): $${invoiceData.tax.amount.toFixed(2)}`, {
      x: 400,
      y: yPos,
      size: 10,
      font: helveticaFont
    });
  }

  yPos -= 20;
  page.drawText(`Total: $${invoiceData.total.toFixed(2)}`, {
    x: 400,
    y: yPos,
    size: 12,
    font: helveticaBold
  });

  // Notes
  if (invoiceData.notes) {
    yPos -= 40;
    page.drawText('Notes:', {
      x: 50,
      y: yPos,
      size: 10,
      font: helveticaBold
    });
    yPos -= 15;
    page.drawText(invoiceData.notes, {
      x: 50,
      y: yPos,
      size: 9,
      font: helveticaFont
    });
  }

  // Payment terms
  if (invoiceData.paymentTerms) {
    yPos -= 30;
    page.drawText('Payment Terms:', {
      x: 50,
      y: yPos,
      size: 10,
      font: helveticaBold
    });
    yPos -= 15;
    page.drawText(invoiceData.paymentTerms, {
      x: 50,
      y: yPos,
      size: 9,
      font: helveticaFont
    });
  }

  return pdfDoc.save();
}

// Text and Annotation Addition
export async function addElementsToPDF(
  pdfFile: File,
  textElements: TextElement[],
  annotations: AnnotationElement[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  // Add text elements
  for (const element of textElements) {
    if (element.page > pages.length) continue;
    
    const page = pages[element.page - 1];
    const { height } = page.getSize();

    page.drawText(element.text, {
      x: element.x,
      y: height - element.y, // Convert to PDF coordinates
      size: element.size,
      color: rgb(element.color.r, element.color.g, element.color.b)
    });
  }

  // Add annotations
  for (const annotation of annotations) {
    if (annotation.page > pages.length) continue;
    
    const page = pages[annotation.page - 1];
    const { height } = page.getSize();
    const yPos = height - annotation.y - (annotation.height || 0);

    switch (annotation.type) {
      case 'rectangle':
        page.drawRectangle({
          x: annotation.x,
          y: yPos,
          width: annotation.width || 100,
          height: annotation.height || 50,
          borderColor: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          borderWidth: annotation.strokeWidth
        });
        break;

      case 'circle':
        const radius = Math.min(annotation.width || 50, annotation.height || 50) / 2;
        page.drawCircle({
          x: annotation.x + radius,
          y: yPos + radius,
          size: radius,
          borderColor: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          borderWidth: annotation.strokeWidth
        });
        break;

      case 'line':
        page.drawLine({
          start: { x: annotation.x, y: yPos },
          end: { 
            x: annotation.x + (annotation.width || 100), 
            y: yPos + (annotation.height || 0) 
          },
          color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          thickness: annotation.strokeWidth
        });
        break;

      case 'highlight':
        page.drawRectangle({
          x: annotation.x,
          y: yPos,
          width: annotation.width || 100,
          height: annotation.height || 20,
          color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          opacity: 0.3
        });
        break;
    }
  }

  return pdfDoc.save();
}

// PDF Information Extraction
export async function getPDFInfo(pdfFile: File) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  
  // Get basic info using PDF-lib
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const creator = pdfDoc.getCreator();
  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();

  // Get detailed info using PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const metadata = await pdf.getMetadata();
  const info = metadata.info as Record<string, any>;
  const isEncrypted = typeof info.IsEncrypted === "boolean" ? info.IsEncrypted : false;
  const pdfVersion = typeof info.PDFFormatVersion === "string" ? info.PDFFormatVersion : "";
  typeof (metadata.info as any).PDFFormatVersion === 'string'
    ? (metadata.info as any).PDFFormatVersion
    : '';

return {
  pageCount,
  title,
  author,
  subject,
  creator,
  creationDate,
  modificationDate,
  pdfVersion,
  fileSize: arrayBuffer.byteLength,
  metadata: metadata.info,
  isEncrypted,
  permissions: {
    printing: !isEncrypted,
    copying: !isEncrypted,
    editing: !isEncrypted
  }
 }
};

// PDF Optimization
export async function optimizePDF(pdfFile: File, options: {
  compressImages?: boolean;
  removeMetadata?: boolean;
  reduceFileSize?: boolean;
} = {}): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  if (options.removeMetadata) {
    // Clear metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
  }

  // Save with compression options
  const saveOptions: any = {};
  
  if (options.reduceFileSize) {
    saveOptions.useObjectStreams = false;
    saveOptions.addDefaultPage = false;
  }

  return pdfDoc.save(saveOptions);
}

// PDF Conversion Utilities
export async function convertToPDFA(pdfFile: File): Promise<Uint8Array> {
  // This is a simplified PDF/A conversion
  // In a real implementation, you'd need more sophisticated conversion
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Set PDF/A metadata
  pdfDoc.setTitle(pdfDoc.getTitle() || 'Converted Document');
  pdfDoc.setCreator('PDF Editor');
  pdfDoc.setProducer('PDF-lib');
  
  return pdfDoc.save();
}

// Utility function to download PDF
export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Error handling wrapper
export async function safePDFOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
 };