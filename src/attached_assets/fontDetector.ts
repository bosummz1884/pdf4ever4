import * as pdfjsLib from 'pdfjs-dist';

/**
 * Detects font names used in the first page of the PDF file.
 * Returns an array of font names in use.
 */
export async function detectFontsInPDF(file: File): Promise<Set<string>> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    const fontNames = new Set<string>();
    for (const item of textContent.items) {
      if ((item as any).fontName) {
        fontNames.add((item as any).fontName);
      }
    }

    return fontNames;
  } catch (error) {
    console.error('Error detecting fonts in PDF:', error);
    return new Set();
  }
}

/**
 * Enhanced font detector class with improved PDF font analysis
 */
export class EnhancedFontDetector {
  private detectedFonts = new Set<string>();
  private systemFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Verdana', 'Georgia', 'Palatino', 'Calibri', 'Segoe UI', 'Open Sans',
    'Roboto', 'Lato', 'Montserrat', 'Source Sans Pro'
  ];
  
  async analyzePDFFonts(file: File): Promise<Set<string>> {
    this.detectedFonts = await detectFontsInPDF(file);
    return this.detectedFonts;
  }
  
  getDetectedFonts(): Set<string> {
    return this.detectedFonts;
  }

  getAvailableFonts(): string[] {
    return this.systemFonts;
  }
  
  mapToSystemFont(pdfFont: string): string {
    const fontMappings: Record<string, string> = {
      'Times-Roman': 'Times New Roman',
      'Times-Bold': 'Times New Roman',
      'Times-BoldItalic': 'Times New Roman',
      'Times-Italic': 'Times New Roman',
      'Helvetica': 'Arial',
      'Helvetica-Bold': 'Arial',
      'Helvetica-BoldOblique': 'Arial',
      'Helvetica-Oblique': 'Arial',
      'Courier': 'Courier New',
      'Courier-Bold': 'Courier New',
      'Courier-BoldOblique': 'Courier New',
      'Courier-Oblique': 'Courier New',
      'ArialMT': 'Arial',
      'Arial-BoldMT': 'Arial',
      'Arial-ItalicMT': 'Arial',
      'Arial-BoldItalicMT': 'Arial',
      'TimesNewRomanPSMT': 'Times New Roman',
      'TimesNewRomanPS-BoldMT': 'Times New Roman',
      'TimesNewRomanPS-ItalicMT': 'Times New Roman',
      'TimesNewRomanPS-BoldItalicMT': 'Times New Roman'
    };

    // Direct mapping first
    if (fontMappings[pdfFont]) {
      return fontMappings[pdfFont];
    }
    
    const lower = pdfFont.toLowerCase();
    
    // More sophisticated font matching
    if (lower.includes('times') || lower.includes('roman')) return 'Times New Roman';
    if (lower.includes('arial') || lower.includes('helvetica')) return 'Arial';
    if (lower.includes('courier') || lower.includes('mono')) return 'Courier New';
    if (lower.includes('verdana')) return 'Verdana';
    if (lower.includes('georgia')) return 'Georgia';
    if (lower.includes('calibri')) return 'Calibri';
    if (lower.includes('segoe')) return 'Segoe UI';
    if (lower.includes('roboto')) return 'Roboto';
    if (lower.includes('lato')) return 'Lato';
    if (lower.includes('montserrat')) return 'Montserrat';
    if (lower.includes('source')) return 'Source Sans Pro';
    
    // Fallback to Arial for unknown fonts
    return 'Arial';
  }

  getFontProperties(pdfFont: string): { weight: string; style: string } {
    const lower = pdfFont.toLowerCase();
    let weight = 'normal';
    let style = 'normal';
    
    if (lower.includes('bold')) weight = 'bold';
    if (lower.includes('italic') || lower.includes('oblique')) style = 'italic';
    
    return { weight, style };
  }
}