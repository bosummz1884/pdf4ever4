import React, { useState, useRef, useCallback, ChangeEvent, DragEvent } from "react";
import { createWorker, PSM, RecognizeResult, Worker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import "pdfjs-dist/web/pdf_viewer.css";

// If you use pdfjs-dist, set the worker location (adjust if needed)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  page: number;
}

export interface OCRToolProps {
  pdfDocument?: any;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  currentPage?: number;
  onTextDetected?: (results: OCRResult[]) => void;
  onTextBoxCreate?: (x: number, y: number, text: string) => void;
  onTextExtracted?: (text: string) => void;
}

const OCRTool: React.FC<OCRToolProps> = ({
  pdfDocument,
  canvasRef,
  currentPage = 1,
  onTextDetected,
  onTextBoxCreate,
  onTextExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [extractedText, setExtractedText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages: { code: string; name: string }[] = [
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

  // OCR an image (from file or canvas)
  const ocrImage = useCallback(
    async (imgUrl: string, pageNumber: number = 1, totalPages: number = 1) => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        const worker: Worker = await createWorker(selectedLanguage);

        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist:
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?-()[]{}:;\"'",
        });

        const { data }: RecognizeResult = await worker.recognize(
          imgUrl,
          {},
          {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === "recognizing text") {
                setProgress(
                  Math.round(
                    ((pageNumber - 1) / totalPages + m.progress / totalPages) * 100
                  )
                );
              }
            },
          }
        );

        const newResults: OCRResult[] = Array.isArray(data.words)
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

        if (totalPages === 1) {
          setExtractedText(data.text || "");
          setOcrResults(newResults);
          onTextDetected?.(newResults);
          setIsProcessing(false);
          setProgress(100);
          // Simple callback (OcrExtractor style)
          onTextExtracted?.(data.text || "");
        }

        return { ocrText: data.text || "", ocrResults: newResults };
      } catch (e: any) {
        setError("OCR failed: " + (e?.message || e));
        setIsProcessing(false);
        setProgress(0);
        return { ocrText: "", ocrResults: [] };
      }
    },
    [selectedLanguage, onTextDetected, onTextExtracted]
  );

  // Multi-page PDF OCR
  const handlePdfUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      try {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore - pdfjsLib types sometimes conflict
        const pdf: any = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let allResults: OCRResult[] = [];
        let allText: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          setProgress(Math.round(((pageNum - 1) / pdf.numPages) * 100));
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          const imgUrl = canvas.toDataURL("image/png");
          if (pageNum === 1) setPreviewUrl(imgUrl);

          const { ocrText, ocrResults } = await ocrImage(imgUrl, pageNum, pdf.numPages);
          allText.push(ocrText);
          allResults = allResults.concat(ocrResults);
        }

        setExtractedText(allText.join("\n\n"));
        setOcrResults(allResults);
        onTextDetected?.(allResults);
        setProgress(100);
      } catch (e: any) {
        setError("Failed to extract text from PDF: " + (e?.message || e));
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [selectedLanguage, onTextDetected, ocrImage]
  );

  // IMAGE/PDF UPLOAD HANDLER
  const handleFileInput = (): void => fileInputRef.current?.click();

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviewUrl(null);
    setExtractedText("");
    setOcrResults([]);

    if (file.type === "application/pdf") {
      await handlePdfUpload(file);
    } else if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      await ocrImage(url);
    } else {
      setError("Unsupported file type. Please upload an image or PDF.");
    }
  };

  // Canvas OCR (for use with your in-app editor)
  const performOCR = useCallback(async () => {
    if (!canvasRef?.current) return;
    setPreviewUrl(null);
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");
    await ocrImage(imageData);
  }, [canvasRef, ocrImage]);

  // PDF text extraction (not OCR, just textContent)
  const extractTextFromPDF = useCallback(async () => {
    if (!pdfDocument) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const page = await pdfDocument.getPage(currentPage);
      const textContent = await page.getTextContent();

      let extractedPageText = "";
      const results: OCRResult[] = [];

      (textContent.items || []).forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          extractedPageText += item.str + " ";
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

      setExtractedText(extractedPageText.trim());
      setOcrResults(results);
      onTextDetected?.(results);
      setProgress(100);
    } catch (error) {
      setError("PDF text extraction error.");
      console.error("PDF text extraction error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [pdfDocument, currentPage, onTextDetected]);

  const copyToClipboard = useCallback(() => {
    if (extractedText) navigator.clipboard.writeText(extractedText);
  }, [extractedText]);

  const downloadText = useCallback(() => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `extracted-text-page-${currentPage}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [extractedText, currentPage]);

  const createTextBoxFromResult = useCallback(
    (result: OCRResult) => {
      if (onTextBoxCreate) {
        onTextBoxCreate(result.bbox.x0, result.bbox.y0, result.text);
      }
    },
    [onTextBoxCreate]
  );

  const highlightTextOnCanvas = useCallback(
    (result: OCRResult) => {
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
    },
    [canvasRef]
  );

  // Simple OcrExtractor button
  const handleSimpleImageOcr = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
        const result: RecognizeResult = await recognize(file, selectedLanguage, {
          logger: (m: { progress?: number }) => setProgress(Math.round(((m.progress || 0) * 100))),
        });
        setExtractedText(result.data.text);
        onTextExtracted?.(result.data.text);
        setIsProcessing(false);
        setProgress(100);
      } catch (e) {
        setError("OCR failed.");
        setIsProcessing(false);
        setProgress(0);
      }
    };

    input.click();
  };

  // Drag & drop support
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setError(null);
    setPreviewUrl(null);
    setExtractedText("");
    setOcrResults([]);
    if (file.type === "application/pdf") {
      await handlePdfUpload(file);
    } else if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      await ocrImage(url);
    } else {
      setError("Unsupported file type. Please upload an image or PDF.");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSimpleImageOcr}
        style={{
          padding: "10px 16px",
          background: "#0984e3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
        disabled={isProcessing}
      >
        🔎 Extract Text from Image (Quick OCR)
      </button>
      <div
        className={`border-2 border-dashed rounded-lg py-6 px-4 mb-2 cursor-pointer ${isProcessing ? "opacity-60 pointer-events-none" : "hover:bg-secondary/5"}`}
        onClick={handleFileInput}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        aria-label="Upload image or PDF for OCR"
        tabIndex={0}
        role="button"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
          aria-label="Upload image or PDF for OCR extraction"
        />
        <div className="flex flex-col items-center">
          <div className="font-semibold">Drag & drop or click to upload an image or PDF</div>
          <div className="text-xs text-muted-foreground mt-1">
            Supported: JPG, PNG, PDF
          </div>
        </div>
      </div>
      {previewUrl && (
        <div className="mb-2 text-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="inline-block max-h-56 border rounded shadow-sm"
          />
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={extractTextFromPDF}
          disabled={isProcessing || !pdfDocument}
          style={{
            padding: "8px 12px",
            marginRight: 8,
            background: "#636e72",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: isProcessing ? "not-allowed" : "pointer"
          }}
        >
          Extract PDF Text
        </button>
        <button
          onClick={performOCR}
          disabled={isProcessing || !canvasRef?.current}
          style={{
            padding: "8px 12px",
            marginRight: 8,
            background: "#636e72",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: isProcessing ? "not-allowed" : "pointer"
          }}
        >
          OCR Canvas
        </button>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={isProcessing}
          style={{ padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
          aria-label="OCR language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        {ocrResults.length > 0 && (
          <span style={{ marginLeft: 10, fontWeight: 500 }}>
            {ocrResults.length} text regions found
          </span>
        )}
        {isProcessing && (
          <div style={{ marginTop: 10 }}>
            <div style={{ width: "100%", height: "10px", background: "#eee", borderRadius: 5 }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "#0984e3",
                borderRadius: 5,
                transition: "width 0.2s"
              }} />
            </div>
            <p style={{ fontSize: "0.9rem", color: "#636e72" }}>
              {progress > 0 ? `Processing: ${progress}%` : "Initializing..."}
            </p>
          </div>
        )}
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 8 }}>{error}</div>
      )}
      {extractedText && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <strong>Extracted Text</strong>
            <button onClick={copyToClipboard} style={{ fontSize: "0.9em" }}>Copy</button>
            <button onClick={downloadText} style={{ fontSize: "0.9em" }}>Download</button>
          </div>
          <textarea
            value={extractedText}
            onChange={e => setExtractedText(e.target.value)}
            style={{ width: "100%", minHeight: 80, fontFamily: "monospace", fontSize: 14, borderRadius: 4, border: "1px solid #ddd" }}
            placeholder="Extracted text will appear here..."
          />
        </div>
      )}
      {ocrResults.length > 0 && (
        <div>
          <strong>Detected Text Regions</strong>
          <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 8 }}>
            {ocrResults.map((result) => (
              <div
                key={result.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  border: "1px solid #eee",
                  borderRadius: 5,
                  marginBottom: 6,
                  background: "#fafafa"
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.96em" }}>{result.text}</div>
                  <div style={{ fontSize: "0.8em", color: "#636e72" }}>
                    Confidence: {Math.round(result.confidence)}%
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      fontSize: "0.9em",
                      padding: "2px 6px",
                      border: "1px solid #bbb",
                      borderRadius: 4,
                      background: "#ffeaa7"
                    }}
                    onClick={() => highlightTextOnCanvas(result)}
                  >
                    Highlight
                  </button>
                  {onTextBoxCreate && (
                    <button
                      style={{
                        fontSize: "0.9em",
                        padding: "2px 6px",
                        border: "1px solid #bbb",
                        borderRadius: 4,
                        background: "#b2bec3"
                      }}
                      onClick={() => createTextBoxFromResult(result)}
                    >
                      Add Box
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRTool;
