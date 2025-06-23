import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Highlighter,
  Square,
  Circle,
  Edit3,
  Eraser,
  Type,
  Palette,
  MousePointer,
  Undo,
  Redo,
  Trash2,
  Save,
  PenTool,
  Signature,
  Download,
} from "lucide-react";

// --- PDF LIB & PDF.js UTILS ---
import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
// For backend use, pdfjsLib import should point to wherever you have pdfjs-dist set up
// import { pdfjsLib } from "./pdfWorker";

// ========== Types (Unified for Front + Backend) ==========
export interface PDFMergeOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}
export interface PDFSplitOptions {
  outputFormat?: "separate" | "range";
  pageRanges?: Array<{ start: number; end: number }>;
  prefix?: string;
}
export interface FormField {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "signature";
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

export interface AnnotationElement {
  type: "rectangle" | "circle" | "line" | "highlight";
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: { r: number; g: number; b: number };
  strokeWidth: number;
  page: number;
}

// --- AnnotationManager React Component Types ---
export interface Annotation {
  id: string;
  type:
  | "highlight"
  | "rectangle"
  | "circle"
  | "freeform"
  | "signature"
  | "text"
  | "checkmark"
  | "x-mark"
  | "line"
  | "image";
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
interface AnnotationManagerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentPage: number;
  zoom: number;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  showControls?: boolean;
}

// ================== REACT COMPONENT ======================
export default function AnnotationManager({
  canvasRef,
  currentPage,
  zoom = 1,
  onAnnotationsChange,
  showControls = true,
}: AnnotationManagerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<
    | "select"
    | "highlight"
    | "rectangle"
    | "circle"
    | "freeform"
    | "eraser"
    | "signature"
    | "text"
    | "checkmark"
    | "x-mark"
    | "line"
  >("select");
  const [color, setColor] = useState("#ffff00");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [signatureData, setSignatureData] = useState<string>("");

  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- UI canvas logic (unchanged) ---
  useEffect(() => {
    if (canvasRef.current && annotationCanvasRef.current) {
      const mainCanvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;

      annotationCanvas.width = mainCanvas.width;
      annotationCanvas.height = mainCanvas.height;
      annotationCanvas.style.position = "absolute";
      annotationCanvas.style.top = "0";
      annotationCanvas.style.left = "0";
      annotationCanvas.style.pointerEvents =
        currentTool === "select" ? "none" : "auto";
      annotationCanvas.style.zIndex = "10";
    }
  }, [canvasRef, currentTool]);

  useEffect(() => {
    drawAnnotations();
    onAnnotationsChange?.(annotations);
  }, [annotations, currentPage, zoom]);

  const drawAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations
      .filter((annotation) => annotation.page === currentPage)
      .forEach((annotation) => {
        ctx.save();
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth * zoom;

        const x = annotation.x * zoom;
        const y = annotation.y * zoom;
        const width = annotation.width * zoom;
        const height = annotation.height * zoom;

        switch (annotation.type) {
          case "highlight":
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, y, width, height);
            break;

          case "rectangle":
            ctx.strokeRect(x, y, width, height);
            if (selectedAnnotationId === annotation.id) {
              ctx.strokeStyle = "#0066ff";
              ctx.lineWidth = 2;
              ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
            }
            break;

          case "circle":
            ctx.beginPath();
            ctx.ellipse(
              x + width / 2,
              y + height / 2,
              width / 2,
              height / 2,
              0,
              0,
              2 * Math.PI,
            );
            ctx.stroke();
            break;

          case "freeform":
            if (annotation.points && annotation.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(
                annotation.points[0] * zoom,
                annotation.points[1] * zoom,
              );
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(
                  annotation.points[i] * zoom,
                  annotation.points[i + 1] * zoom,
                );
              }
              ctx.stroke();
            }
            break;

          case "signature":
            if (annotation.points && annotation.points.length > 1) {
              ctx.lineWidth = 2 * zoom;
              ctx.beginPath();
              ctx.moveTo(
                annotation.points[0] * zoom,
                annotation.points[1] * zoom,
              );
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(
                  annotation.points[i] * zoom,
                  annotation.points[i + 1] * zoom,
                );
              }
              ctx.stroke();
            }
            break;

          case "text":
            if (annotation.text) {
              ctx.font = `${(annotation.fontSize || 16) * zoom}px Arial`;
              ctx.fillText(
                annotation.text,
                x,
                y + (annotation.fontSize || 16) * zoom,
              );
            }
            break;
        }

        ctx.restore();
      });
  }, [annotations, currentPage, zoom, selectedAnnotationId]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent) => {
      const canvas = annotationCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (currentTool === "select") return;

      const point = getCanvasPoint(e);
      setIsDrawing(true);
      setStartPoint(point);

      if (currentTool === "freeform" || currentTool === "signature") {
        setCurrentPath([point.x, point.y]);
      }
    },
    [currentTool, getCanvasPoint],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;

      const point = getCanvasPoint(e);

      if (currentTool === "freeform" || currentTool === "signature") {
        setCurrentPath((prev) => [...prev, point.x, point.y]);

        // Draw temporary path
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && currentPath.length > 2) {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth * zoom;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(
            currentPath[currentPath.length - 4] * zoom,
            currentPath[currentPath.length - 3] * zoom,
          );
          ctx.lineTo(point.x * zoom, point.y * zoom);
          ctx.stroke();
        }
      } else if (currentTool === "eraser") {
        handleErase(point.x, point.y);
      }
    },
    [
      isDrawing,
      startPoint,
      currentTool,
      currentPath,
      color,
      strokeWidth,
      zoom,
      getCanvasPoint,
    ],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint || currentTool === "select") return;

      const point = getCanvasPoint(e);
      const newId = `annotation-${Date.now()}`;

      let newAnnotation: Annotation;

      switch (currentTool) {
        case "highlight":
        case "rectangle":
          newAnnotation = {
            id: newId,
            type: currentTool,
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
            color,
            strokeWidth,
            page: currentPage,
          };
          break;

        case "circle":
          newAnnotation = {
            id: newId,
            type: "circle",
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
            color,
            strokeWidth,
            page: currentPage,
          };
          break;

        case "checkmark":
        case "x-mark":
          newAnnotation = {
            id: newId,
            type: currentTool,
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
            color,
            strokeWidth,
            page: currentPage,
          };
          break;

        case "freeform":
        case "signature":
          if (currentPath.length > 2) {
            const minX = Math.min(...currentPath.filter((_, i) => i % 2 === 0));
            const maxX = Math.max(...currentPath.filter((_, i) => i % 2 === 0));
            const minY = Math.min(...currentPath.filter((_, i) => i % 2 === 1));
            const maxY = Math.max(...currentPath.filter((_, i) => i % 2 === 1));

            newAnnotation = {
              id: newId,
              type: currentTool,
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
              color,
              strokeWidth,
              page: currentPage,
              points: currentPath,
            };
          } else {
            setIsDrawing(false);
            setStartPoint(null);
            setCurrentPath([]);
            return;
          }
          break;

        default:
          setIsDrawing(false);
          setStartPoint(null);
          setCurrentPath([]);
          return;
      }

      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPath([]);
    },
    [
      isDrawing,
      startPoint,
      currentTool,
      currentPath,
      color,
      strokeWidth,
      currentPage,
      annotations,
      getCanvasPoint,
    ],
  );

  const handleErase = useCallback(
    (x: number, y: number) => {
      const toRemove = annotations.filter((annotation) => {
        if (annotation.page !== currentPage) return false;

        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const distance = Math.sqrt(
          Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2),
        );

        return distance < eraserSize / 2;
      });

      if (toRemove.length > 0) {
        const newAnnotations = annotations.filter((a) => !toRemove.includes(a));
        setAnnotations(newAnnotations);
      }
    },
    [annotations, currentPage, eraserSize],
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      const newAnnotations = annotations.filter((a) => a.id !== id);
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
      }
    },
    [annotations, selectedAnnotationId],
  );

  const saveToHistory = useCallback(
    (newAnnotations: Annotation[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...newAnnotations]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    saveToHistory([]);
  }, [saveToHistory]);

  const exportAnnotations = useCallback(() => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations-page-${currentPage}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations, currentPage]);

  const currentPageAnnotations = annotations.filter(
    (a) => a.page === currentPage,
  );

  return (
    <>
      {showControls && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Annotation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tool Selection */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={currentTool === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("select")}
                >
                  <MousePointer className="h-4 w-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={currentTool === "highlight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("highlight")}
                >
                  <Highlighter className="h-4 w-4 mr-1" />
                  Highlight
                </Button>
                <Button
                  variant={currentTool === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("rectangle")}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Rectangle
                </Button>
                <Button
                  variant={currentTool === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("circle")}
                >
                  <Circle className="h-4 w-4 mr-1" />
                  Circle
                </Button>
                <Button
                  variant={currentTool === "freeform" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("freeform")}
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Draw
                </Button>
                <Button
                  variant={currentTool === "signature" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("signature")}
                >
                  <Signature className="h-4 w-4 mr-1" />
                  Sign
                </Button>
                <Button
                  variant={currentTool === "eraser" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("eraser")}
                >
                  <Eraser className="h-4 w-4 mr-1" />
                  Eraser
                </Button>
              </div>

              {/* Style Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>

                {currentTool !== "eraser" && (
                  <div className="flex items-center gap-2 min-w-32">
                    <span className="text-sm">Stroke:</span>
                    <Slider
                      value={[strokeWidth]}
                      onValueChange={(value) => setStrokeWidth(value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />

                    <span className="text-sm w-6">{strokeWidth}</span>
                  </div>
                )}

                {currentTool === "eraser" && (
                  <div className="flex items-center gap-2 min-w-32">
                    <span className="text-sm">Size:</span>
                    <Slider
                      value={[eraserSize]}
                      onValueChange={(value) => setEraserSize(value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="flex-1"
                    />

                    <span className="text-sm w-8">{eraserSize}px</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4 mr-1" />
                  Redo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAnnotations}
                  disabled={currentPageAnnotations.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAnnotations}
                  disabled={annotations.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>

                <Badge variant="secondary" className="ml-auto">
                  {currentPageAnnotations.length} annotation(s)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annotation Canvas */}
      <canvas
        ref={annotationCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: currentTool === "select" ? "none" : "auto",
          cursor:
            currentTool === "eraser"
              ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${eraserSize}' height='${eraserSize}' viewBox='0 0 ${eraserSize} ${eraserSize}'><circle cx='${eraserSize / 2}' cy='${eraserSize / 2}' r='${eraserSize / 2}' fill='none' stroke='red' stroke-width='2'/></svg>") ${eraserSize / 2} ${eraserSize / 2}, crosshair`
              : currentTool === "select"
                ? "default"
                : "crosshair",
          zIndex: 10,
        }}
      />
    </>
  );
}

// ===================== PDF/ANNOTATION UTILS (BACK + FRONT) =====================

// All functions below are from your first file, fully preserved.
// You may import these in your backend, or use them via export from this file!

// ------------- PDF Merging -------------
export async function mergePDFs(pdfFiles: File[], options: PDFMergeOptions = {}): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
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

// ------------- PDF Splitting -------------
export async function extractPagesFromPdf(
  pdfFile: File,
  pageNumbers: number[],
  options: PDFSplitOptions = {},
): Promise<Uint8Array[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const results: Uint8Array[] = [];
  if (options.outputFormat === "range" && options.pageRanges) {
    for (const range of options.pageRanges) {
      const newPdf = await PDFDocument.create();
      const pages: number[] = [];
      for (let i = range.start - 1; i < range.end && i < sourcePdf.getPageCount(); i++) {
        pages.push(i);
      }
      const copiedPages = await newPdf.copyPages(sourcePdf, pages);
      copiedPages.forEach((page) => newPdf.addPage(page));
      results.push(await newPdf.save());
    }
  } else {
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

// ------------- Form Filling -------------
export async function fillPDFForm(pdfFile: File, formData: Record<string, any>): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const form = pdfDoc.getForm();

  for (const [fieldName, value] of Object.entries(formData)) {
    try {
      const field = form.getField(fieldName);
      if (field.constructor.name === "PDFTextField") {
        (field as any).setText(String(value));
      } else if (field.constructor.name === "PDFCheckBox") {
        if (value) (field as any).check();
        else (field as any).uncheck();
      } else if (field.constructor.name === "PDFDropdown") {
        (field as any).select(String(value));
      } else if (field.constructor.name === "PDFRadioGroup") {
        (field as any).select(String(value));
      }
    } catch (error) {
      console.warn(`Could not fill field ${fieldName}:`, error);
    }
  }
  form.flatten();
  return pdfDoc.save();
}

// ------------- Add Form Fields -------------
export async function addFormFieldsToPDF(
  pdfFile: File,
  fields: FormField[],
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const field of fields) {
    if (field.page > pages.length) continue;
    const page = pages[field.page - 1];
    const { height } = page.getSize();
    const yPos = height - field.y - field.height;

    switch (field.type) {
      case "text":
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });
        if (typeof field.value === "string" && field.value) {
          page.drawText(field.value, {
            x: field.x + 5,
            y: yPos + field.height / 2 - 6,
            size: 12,
            color: rgb(0, 0, 0),
          });
        }
        break;
      case "checkbox":
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });
        if (field.value === true) {
          page.drawText("✓", {
            x: field.x + field.width / 2 - 6,
            y: yPos + field.height / 2 - 6,
            size: 14,
            color: rgb(0, 0, 0),
          });
        }
        break;
      case "signature":
        page.drawRectangle({
          x: field.x,
          y: yPos,
          width: field.width,
          height: field.height,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
          color: rgb(0.98, 0.98, 0.98),
        });
        page.drawText("Signature", {
          x: field.x + 5,
          y: yPos + field.height / 2 - 6,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
        break;
    }
  }
  return pdfDoc.save();
}

// ------------- Invoice Generation -------------
export async function generateInvoice(invoiceData: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPos = height - 50;

  // Header
  page.drawText("INVOICE", { x: 50, y: yPos, size: 24, font: helveticaBold, color: rgb(0, 0, 0) });
  page.drawText(`Invoice #: ${invoiceData.invoiceNumber}`, { x: width - 200, y: yPos, size: 12, font: helveticaFont });
  yPos -= 20;
  page.drawText(`Date: ${invoiceData.date}`, { x: width - 200, y: yPos, size: 12, font: helveticaFont });
  if (invoiceData.dueDate) {
    yPos -= 15;
    page.drawText(`Due Date: ${invoiceData.dueDate}`, { x: width - 200, y: yPos, size: 12, font: helveticaFont });
  }
  yPos -= 40;
  // From section
  page.drawText("From:", { x: 50, y: yPos, size: 12, font: helveticaBold });
  yPos -= 20;
  page.drawText(invoiceData.from.name, { x: 50, y: yPos, size: 12, font: helveticaFont });
  yPos -= 15;
  invoiceData.from.address.forEach((line) => {
    page.drawText(line, { x: 50, y: yPos, size: 10, font: helveticaFont });
    yPos -= 12;
  });
  // To section
  yPos = height - 170;
  page.drawText("To:", { x: 300, y: yPos, size: 12, font: helveticaBold });
  yPos -= 20;
  page.drawText(invoiceData.to.name, { x: 300, y: yPos, size: 12, font: helveticaFont });
  yPos -= 15;
  invoiceData.to.address.forEach((line) => {
    page.drawText(line, { x: 300, y: yPos, size: 10, font: helveticaFont });
    yPos -= 12;
  });
  // Items table
  yPos = height - 300;
  page.drawRectangle({ x: 50, y: yPos - 20, width: width - 100, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Description", { x: 60, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText("Qty", { x: 350, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText("Rate", { x: 400, y: yPos - 15, size: 10, font: helveticaBold });
  page.drawText("Amount", { x: 480, y: yPos - 15, size: 10, font: helveticaBold });
  yPos -= 25;
  invoiceData.items.forEach((item) => {
    page.drawText(item.description, { x: 60, y: yPos, size: 10, font: helveticaFont });
    page.drawText(item.quantity.toString(), { x: 360, y: yPos, size: 10, font: helveticaFont });
    page.drawText(`$${item.rate.toFixed(2)}`, { x: 400, y: yPos, size: 10, font: helveticaFont });
    page.drawText(`$${item.amount.toFixed(2)}`, { x: 480, y: yPos, size: 10, font: helveticaFont });
    yPos -= 20;
  });
  yPos -= 20;
  page.drawText(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, { x: 400, y: yPos, size: 10, font: helveticaFont });
  if (invoiceData.tax) {
    yPos -= 15;
    page.drawText(`Tax (${invoiceData.tax.rate}%): $${invoiceData.tax.amount.toFixed(2)}`, {
      x: 400, y: yPos, size: 10, font: helveticaFont,
    });
  }
  yPos -= 20;
  page.drawText(`Total: $${invoiceData.total.toFixed(2)}`, { x: 400, y: yPos, size: 12, font: helveticaBold });
  if (invoiceData.notes) {
    yPos -= 40;
    page.drawText("Notes:", { x: 50, y: yPos, size: 10, font: helveticaBold });
    yPos -= 15;
    page.drawText(invoiceData.notes, { x: 50, y: yPos, size: 9, font: helveticaFont });
  }
  if (invoiceData.paymentTerms) {
    yPos -= 30;
    page.drawText("Payment Terms:", { x: 50, y: yPos, size: 10, font: helveticaBold });
    yPos -= 15;
    page.drawText(invoiceData.paymentTerms, { x: 50, y: yPos, size: 9, font: helveticaFont });
  }
  return pdfDoc.save();
}

// ------------- Add Text & Annotation -------------
export async function addElementsToPDF(
  pdfFile: File,
  textElements: TextElement[],
  annotations: AnnotationElement[],
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const element of textElements) {
    if (element.page > pages.length) continue;
    const page = pages[element.page - 1];
    const { height } = page.getSize();
    page.drawText(element.text, {
      x: element.x,
      y: height - element.y,
      size: element.size,
      color: rgb(element.color.r, element.color.g, element.color.b),
    });
  }

  for (const annotation of annotations) {
    if (annotation.page > pages.length) continue;
    const page = pages[annotation.page - 1];
    const { height } = page.getSize();
    const yPos = height - annotation.y - (annotation.height || 0);

    switch (annotation.type) {
      case "rectangle":
        page.drawRectangle({
          x: annotation.x,
          y: yPos,
          width: annotation.width || 100,
          height: annotation.height || 50,
          borderColor: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          borderWidth: annotation.strokeWidth,
        });
        break;
      case "circle":
        const radius = Math.min(annotation.width || 50, annotation.height || 50) / 2;
        page.drawCircle({
          x: annotation.x + radius,
          y: yPos + radius,
          size: radius,
          borderColor: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          borderWidth: annotation.strokeWidth,
        });
        break;
      case "line":
        page.drawLine({
          start: { x: annotation.x, y: yPos },
          end: {
            x: annotation.x + (annotation.width || 100),
            y: yPos + (annotation.height || 0),
          },
          color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          thickness: annotation.strokeWidth,
        });
        break;
      case "highlight":
        page.drawRectangle({
          x: annotation.x,
          y: yPos,
          width: annotation.width || 100,
          height: annotation.height || 20,
          color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
          opacity: 0.3,
        });
        break;
    }
  }
  return pdfDoc.save();
}

// ------------- PDF Info Extraction -------------
// (NOTE: This requires pdfjsLib for metadata. Uncomment import and usage if running in an environment with PDF.js)
export async function getPDFInfo(pdfFile: File) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const creator = pdfDoc.getCreator();
  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();

  // PDF.js metadata (optional)
  // const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  // const pdf = await loadingTask.promise;
  // const metadata = await pdf.getMetadata();
  // const info = metadata.info as Record<string, any>;
  // const isEncrypted = typeof info.IsEncrypted === "boolean" ? info.IsEncrypted : false;
  // const pdfVersion = typeof info.PDFFormatVersion === "string" ? info.PDFFormatVersion : "";

  return {
    pageCount,
    title,
    author,
    subject,
    creator,
    creationDate,
    modificationDate,
    // pdfVersion,
    fileSize: arrayBuffer.byteLength,
    // metadata: metadata.info,
    // isEncrypted,
    // permissions: {
    //   printing: !isEncrypted,
    //   copying: !isEncrypted,
    //   editing: !isEncrypted,
    // },
  };
}

// ------------- PDF Optimization -------------
export async function optimizePDF(
  pdfFile: File,
  options: {
    compressImages?: boolean;
    removeMetadata?: boolean;
    reduceFileSize?: boolean;
  } = {},
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  if (options.removeMetadata) {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator("");
    pdfDoc.setProducer("");
  }
  const saveOptions: any = {};
  if (options.reduceFileSize) {
    saveOptions.useObjectStreams = false;
    saveOptions.addDefaultPage = false;
  }
  return pdfDoc.save(saveOptions);
}

// ------------- Convert to PDF/A -------------
export async function convertToPDFA(pdfFile: File): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  pdfDoc.setTitle(pdfDoc.getTitle() || "Converted Document");
  pdfDoc.setCreator("PDF Editor");
  pdfDoc.setProducer("PDF-lib");
  return pdfDoc.save();
}

// ------------- Download PDF (Front-end helper) -------------
export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ------------- Safe Operation Wrapper -------------
export async function safePDFOperation<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
