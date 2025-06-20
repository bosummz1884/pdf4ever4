import React, { useState, useRef, useCallback, ChangeEvent, DragEvent } from "react";
import { ocrService, OCR_LANGUAGES } from "../services/ocrService";
import { OCRResult, OCRToolProps } from "../types/ocr";

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

  const performOCROnImage = useCallback(
    async (imageData: string | File, pageNumber: number = 1, totalPages: number = 1) => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        const { ocrText, ocrResults: results } = await ocrService.performOCR(
          imageData,
          selectedLanguage,
          pageNumber,
          totalPages,
          setProgress
        );

        if (totalPages === 1) {
          setExtractedText(ocrText);
          setOcrResults(results);
          onTextDetected?.(results);
          onTextExtracted?.(ocrText);
          setProgress(100);
        }

        return { ocrText, ocrResults: results };
      } catch (error: any) {
        setError(error.message);
        return { ocrText: "", ocrResults: [] };
      } finally {
        if (totalPages === 1) {
          setIsProcessing(false);
        }
      }
    },
    [selectedLanguage, onTextDetected, onTextExtracted]
  );

  const handlePdfUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      
      try {
        const { ocrText, ocrResults: results, previewUrl: preview } = await ocrService.performPDFOCR(
          file,
          selectedLanguage,
          setProgress
        );

        setExtractedText(ocrText);
        setOcrResults(results);
        setPreviewUrl(preview);
        onTextDetected?.(results);
        onTextExtracted?.(ocrText);
        setProgress(100);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedLanguage, onTextDetected, onTextExtracted]
  );

  const handleFileInput = (): void => fileInputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
      await performOCROnImage(url);
    } else {
      setError("Unsupported file type. Please upload an image or PDF.");
    }
  };

  const performCanvasOCR = useCallback(async () => {
    if (!canvasRef?.current) return;
    setPreviewUrl(null);
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");
    await performOCROnImage(imageData);
  }, [canvasRef, performOCROnImage]);

  const extractTextFromPDF = useCallback(async () => {
    if (!pdfDocument) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { extractedText: pageText, results } = await ocrService.extractPDFText(
        pdfDocument,
        currentPage
      );

      setExtractedText(pageText);
      setOcrResults(results);
      onTextDetected?.(results);
      onTextExtracted?.(pageText);
      setProgress(100);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [pdfDocument, currentPage, onTextDetected, onTextExtracted]);

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
      ocrService.highlightTextOnCanvas(result, canvasRef);
    },
    [canvasRef]
  );

  const handleQuickImageOCR = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
        const { ocrText } = await ocrService.performOCR(file, selectedLanguage);
        setExtractedText(ocrText);
        onTextExtracted?.(ocrText);
        setProgress(100);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    input.click();
  };

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
      await performOCROnImage(url);
    } else {
      setError("Unsupported file type. Please upload an image or PDF.");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleQuickImageOCR}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        disabled={isProcessing}
      >
        🔎 Extract Text from Image (Quick OCR)
      </button>
      
      <div
        className={`border-2 border-dashed rounded-lg py-6 px-4 cursor-pointer transition-colors ${
          isProcessing 
            ? "opacity-60 pointer-events-none" 
            : "hover:bg-gray-50 border-gray-300"
        }`}
        onClick={handleFileInput}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center">
          <div className="font-semibold text-gray-700">
            Drag & drop or click to upload an image or PDF
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Supported: JPG, PNG, PDF
          </div>
        </div>
      </div>
      
      {previewUrl && (
        <div className="text-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="inline-block max-h-56 border rounded shadow-sm"
          />
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={extractTextFromPDF}
          disabled={isProcessing || !pdfDocument}
          className="px-3 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Extract PDF Text
        </button>
        
        <button
          onClick={performCanvasOCR}
          disabled={isProcessing || !canvasRef?.current}
          className="px-3 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          OCR Canvas
        </button>
        
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={isProcessing}
          className="px-2 py-1 border rounded"
        >
          {OCR_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        
        {ocrResults.length > 0 && (
          <span className="text-sm font-medium text-gray-600">
            {ocrResults.length} text regions found
          </span>
        )}
      </div>
      
      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {progress > 0 ? `Processing: ${progress}%` : "Initializing..."}
          </p>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {extractedText && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <strong className="text-sm">Extracted Text</strong>
            <button 
              onClick={copyToClipboard}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Copy
            </button>
            <button 
              onClick={downloadText}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Download
            </button>
          </div>
          <textarea
            value={extractedText}
            onChange={e => setExtractedText(e.target.value)}
            className="w-full min-h-20 font-mono text-sm border rounded p-2"
            placeholder="Extracted text will appear here..."
          />
        </div>
      )}
      
      {ocrResults.length > 0 && (
        <div className="space-y-2">
          <strong className="text-sm">Detected Text Regions</strong>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {ocrResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 border rounded bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{result.text}</div>
                  <div className="text-xs text-gray-500">
                    Confidence: {Math.round(result.confidence)}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300"
                    onClick={() => highlightTextOnCanvas(result)}
                  >
                    Highlight
                  </button>
                  {onTextBoxCreate && (
                    <button
                      className="text-xs px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
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