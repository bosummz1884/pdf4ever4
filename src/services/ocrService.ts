import { createWorker, PSM, RecognizeResult, Worker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { OCRResult, OCRLanguage } from "../types/ocr";

// Set the worker location
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export const OCR_LANGUAGES: OCRLanguage[] = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "rus", name: "Russian" },
  { code: "ara", name: "Arabic" },
  { code: "por", name: "Portuguese" },
];

export class OCRService {
  private static instance: OCRService;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async performOCR(
    imageData: string | File,
    language: string = "eng",
    pageNumber: number = 1,
    totalPages: number = 1,
    progressCallback?: (progress: number) => void
  ): Promise<{ ocrText: string; ocrResults: OCRResult[] }> {
    try {
      const worker: Worker = await createWorker(language);

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?-()[]{}:;\"'",
      });

      const { data }: RecognizeResult = await worker.recognize(
        imageData,
        {},
        {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text" && progressCallback) {
              progressCallback(
                Math.round(
                  ((pageNumber - 1) / totalPages + m.progress / totalPages) * 100
                )
              );
            }
          },
        }
      );

      const ocrResults: OCRResult[] = Array.isArray(data.words)
        ? data.words
            .filter(
              (word: any) =>
                word.text && word.text.trim() && word.confidence > 30
            )
            .map((word: any, index: number) => ({
              id: `ocr-${pageNumber}-${index}`,
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
              page: pageNumber,
            }))
        : [];

      await worker.terminate();

      return { ocrText: data.text || "", ocrResults };
    } catch (error: any) {
      throw new Error("OCR failed: " + (error?.message || error));
    }
  }

  async performPDFOCR(
    file: File,
    language: string = "eng",
    progressCallback?: (progress: number) => void
  ): Promise<{ ocrText: string; ocrResults: OCRResult[]; previewUrl?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf: any = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allResults: OCRResult[] = [];
      let allText: string[] = [];
      let previewUrl: string | undefined;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (progressCallback) {
          progressCallback(Math.round(((pageNum - 1) / pdf.numPages) * 100));
        }

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        const imgUrl = canvas.toDataURL("image/png");
        
        if (pageNum === 1) previewUrl = imgUrl;

        const { ocrText, ocrResults } = await this.performOCR(
          imgUrl,
          language,
          pageNum,
          pdf.numPages,
          progressCallback
        );
        
        allText.push(ocrText);
        allResults = allResults.concat(ocrResults);
      }

      return {
        ocrText: allText.join("\n\n"),
        ocrResults: allResults,
        previewUrl,
      };
    } catch (error: any) {
      throw new Error("Failed to extract text from PDF: " + (error?.message || error));
    }
  }

  async extractPDFText(
    pdfDocument: any,
    currentPage: number
  ): Promise<{ extractedText: string; results: OCRResult[] }> {
    try {
      const page = await pdfDocument.getPage(currentPage);
      const textContent = await page.getTextContent();

      let extractedText = "";
      const results: OCRResult[] = [];

      (textContent.items || []).forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          extractedText += item.str + " ";
          results.push({
            id: `pdf-text-${index}`,
            text: item.str,
            confidence: 100,
            bbox: {
              x0: item.transform[4],
              y0: item.transform[5],
              x1: item.transform[4] + (item.width || 0),
              y1: item.transform[5] + (item.height || 0),
            },
            page: currentPage,
          });
        }
      });

      return { extractedText: extractedText.trim(), results };
    } catch (error) {
      throw new Error("PDF text extraction error");
    }
  }

  highlightTextOnCanvas(
    result: OCRResult,
    canvasRef: React.RefObject<HTMLCanvasElement>
  ): void {
    if (!canvasRef?.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
    ctx.fillRect(
      result.bbox.x0,
      result.bbox.y0,
      result.bbox.x1 - result.bbox.x0,
      result.bbox.y1 - result.bbox.y0
    );
    ctx.restore();
  }
}

export const ocrService = OCRService.getInstance();