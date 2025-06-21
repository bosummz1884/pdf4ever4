interface OCRResult {
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

interface OCRToolProps {
  pdfDocument?: any;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  currentPage?: number;
  onTextDetected?: (results: OCRResult[]) => void;
  onTextBoxCreate?: (x: number, y: number, text: string) => void;
  onTextExtracted?: (text: string) => void;
}

interface OCRLanguage {
  code: string;
  name: string;
}