import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
  PenTool,
  Signature,
  Minus,
  Check,
  X
} from "lucide-react";
import { nanoid } from "nanoid";
import { Annotation, AnnotationTool, AnnotationToolsProps } from "../types/pdf-types";

// Predefined colors for quick selection
const colorPalette = [
  "#ffff00", // Yellow
  "#ff0000", // Red  
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ffa500", // Orange
  "#800080", // Purple
  "#008000", // Dark Green
  "#000080", // Navy
];

export default function AnnotationTools({
  canvasRef,
  currentPage,
  zoom = 1,
  scale = 1,
  isActive = true,
  annotations = [],
  onAnnotationsChange,
  currentTool = "select",
  color = "#ffff00",
  strokeWidth = 2,
  showControls = true
}: AnnotationToolsProps) {
  const [annotationList, setAnnotationList] = useState<Annotation[]>(annotations);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>(currentTool);
  const [annotationColor, setAnnotationColor] = useState(color);
  const [brushSize, setBrushSize] = useState(strokeWidth);
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveScale = scale || zoom;

  // Initialize annotation canvas
  useEffect(() => {
    if (canvasRef.current && annotationCanvasRef.current) {
      const mainCanvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;

      annotationCanvas.width = mainCanvas.width;
      annotationCanvas.height = mainCanvas.height;
      annotationCanvas.style.position = "absolute";
      annotationCanvas.style.top = "0";
      annotationCanvas.style.left = "0";
      annotationCanvas.style.pointerEvents = selectedTool === "select" ? "none" : "auto";
      annotationCanvas.style.zIndex = "10";
    }
  }, [canvasRef, selectedTool]);

  // Sync with parent component
  useEffect(() => {
    onAnnotationsChange?.(annotationList);
  }, [annotationList, onAnnotationsChange]);

  // Draw annotations on canvas
  const drawAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotationList
      .filter((annotation) => annotation.page === currentPage)
      .forEach((annotation) => {
        ctx.save();
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth * effectiveScale;

        const x = annotation.x * effectiveScale;
        const y = annotation.y * effectiveScale;
        const width = annotation.width * effectiveScale;
        const height = annotation.height * effectiveScale;

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

          case "line":
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y + height);
            ctx.stroke();
            break;

          case "freeform":
          case "signature":
            if (annotation.points && annotation.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(
                annotation.points[0] * effectiveScale,
                annotation.points[1] * effectiveScale,
              );
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(
                  annotation.points[i] * effectiveScale,
                  annotation.points[i + 1] * effectiveScale,
                );
              }
              ctx.stroke();
            }
            break;

          case "text":
            if (annotation.text) {
              ctx.font = `${(annotation.fontSize || 16) * effectiveScale}px Arial`;
              ctx.fillText(
                annotation.text,
                x,
                y + (annotation.fontSize || 16) * effectiveScale,
              );
            }
            break;

          case "checkmark":
            // Draw checkmark
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2, y + height * 0.5);
            ctx.lineTo(x + width * 0.4, y + height * 0.7);
            ctx.lineTo(x + width * 0.8, y + height * 0.3);
            ctx.stroke();
            break;

          case "x-mark":
            // Draw X mark
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2, y + height * 0.2);
            ctx.lineTo(x + width * 0.8, y + height * 0.8);
            ctx.moveTo(x + width * 0.8, y + height * 0.2);
            ctx.lineTo(x + width * 0.2, y + height * 0.8);
            ctx.stroke();
            break;
        }

        ctx.restore();
      });
  }, [annotationList, currentPage, effectiveScale, selectedAnnotationId]);

  // Redraw when annotations change
  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  // Get canvas coordinates from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / effectiveScale,
      y: (e.clientY - rect.top) / effectiveScale,
    };
  }, [effectiveScale]);

  // Add to history for undo/redo
  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === "select") return;

    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (selectedTool === "freeform" || selectedTool === "signature") {
      setCurrentPath([point.x, point.y]);
    }
  }, [selectedTool, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint(e);

    if (selectedTool === "freeform" || selectedTool === "signature") {
      setCurrentPath((prev) => [...prev, point.x, point.y]);

      // Draw temporary path
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentPath.length > 2) {
        ctx.strokeStyle = annotationColor;
        ctx.lineWidth = brushSize * effectiveScale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(
          currentPath[currentPath.length - 4] * effectiveScale,
          currentPath[currentPath.length - 3] * effectiveScale,
        );
        ctx.lineTo(point.x * effectiveScale, point.y * effectiveScale);
        ctx.stroke();
      }
    } else if (selectedTool === "eraser") {
      handleErase(point.x, point.y);
    }
  }, [isDrawing, startPoint, selectedTool, currentPath, annotationColor, brushSize, effectiveScale, getCanvasPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || selectedTool === "select") return;

    const point = getCanvasPoint(e);
    const newId = nanoid();

    let newAnnotation: Annotation;

    switch (selectedTool) {
      case "highlight":
      case "rectangle":
        newAnnotation = {
          id: newId,
          type: selectedTool,
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color: annotationColor,
          strokeWidth: brushSize,
          page: currentPage,
        } as Annotation | Annotation;
        break;

      case "circle":
        newAnnotation = {
          id: newId,
          type: "circle",
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color: annotationColor,
          strokeWidth: brushSize,
          page: currentPage,
        } as Annotation;
        break;

      case "line":
        newAnnotation = {
          id: newId,
          type: "line",
          x: startPoint.x,
          y: startPoint.y,
          width: point.x - startPoint.x,
          height: point.y - startPoint.y,
          color: annotationColor,
          strokeWidth: brushSize,
          page: currentPage,
        } as Annotation;
        break;

      case "checkmark":
      case "x-mark":
        newAnnotation = {
          id: newId,
          type: selectedTool,
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color: annotationColor,
          strokeWidth: brushSize,
          page: currentPage,
        } as Annotation;
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
            type: selectedTool,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            color: annotationColor,
            strokeWidth: brushSize,
            page: currentPage,
            points: currentPath,
          } as Annotation;
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

    const newAnnotations = [...annotationList, newAnnotation];
    setAnnotationList(newAnnotations);
    addToHistory(newAnnotations);

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPath([]);
  }, [isDrawing, startPoint, selectedTool, getCanvasPoint, annotationColor, brushSize, currentPage, currentPath, annotationList, addToHistory]);

  // Handle eraser
  const handleErase = useCallback((x: number, y: number) => {
    const toRemove = annotationList.filter(annotation => {
      if (annotation.page !== currentPage) return false;
      
      const distance = Math.sqrt(
        Math.pow(x - (annotation.x + annotation.width / 2), 2) +
        Math.pow(y - (annotation.y + annotation.height / 2), 2)
      );
      
      return distance < eraserSize;
    });

    if (toRemove.length > 0) {
      const newAnnotations = annotationList.filter(a => !toRemove.includes(a));
      setAnnotationList(newAnnotations);
      addToHistory(newAnnotations);
    }
  }, [annotationList, currentPage, eraserSize, addToHistory]);

  // Clear all annotations on current page
  const clearAnnotations = useCallback(() => {
    const newAnnotations = annotationList.filter(a => a.page !== currentPage);
    setAnnotationList(newAnnotations);
    addToHistory(newAnnotations);
  }, [annotationList, currentPage, addToHistory]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotationList([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotationList([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  // Tool selection buttons
  const toolButtons = [
    { tool: "select" as AnnotationTool, icon: MousePointer, label: "Select" },
    { tool: "highlight" as AnnotationTool, icon: Highlighter, label: "Highlight" },
    { tool: "rectangle" as AnnotationTool, icon: Square, label: "Rectangle" },
    { tool: "circle" as AnnotationTool, icon: Circle, label: "Circle" },
    { tool: "line" as AnnotationTool, icon: Minus, label: "Line" },
    { tool: "freeform" as AnnotationTool, icon: PenTool, label: "Draw" },
    { tool: "signature" as AnnotationTool, icon: Signature, label: "Signature" },
    { tool: "checkmark" as AnnotationTool, icon: Check, label: "Check" },
    { tool: "x-mark" as AnnotationTool, icon: X, label: "X Mark" },
    { tool: "eraser" as AnnotationTool, icon: Eraser, label: "Eraser" },
  ];

  const currentPageAnnotations = annotationList.filter(a => a.page === currentPage);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Controls */}
      {showControls && (
        <div style={{
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          padding: "0.5rem",
          background: "#f8f9fa",
          borderRadius: "8px"
        }}>
          {/* Tool selection */}
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {toolButtons.map(({ tool, icon: Icon, label }) => (
              <Button
                key={tool}
                variant={selectedTool === tool ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool(tool)}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <div style={{ width: "1px", height: "24px", background: "#ddd" }} />

          {/* Color palette */}
          <div style={{ display: "flex", gap: "2px" }}>
            {colorPalette.map((paletteColor) => (
              <button
                key={paletteColor}
                onClick={() => setAnnotationColor(paletteColor)}
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: paletteColor,
                  border: annotationColor === paletteColor ? "2px solid #333" : "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                title={`Color: ${paletteColor}`}
              />
            ))}
            <input
              type="color"
              value={annotationColor}
              onChange={(e) => setAnnotationColor(e.target.value)}
              style={{
                width: "24px",
                height: "24px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            />
          </div>

          <div style={{ width: "1px", height: "24px", background: "#ddd" }} />

          {/* Stroke width */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#666" }}>Size:</span>
            <Slider
              value={[brushSize]}
              onValueChange={([value]) => setBrushSize(value)}
              max={10}
              min={1}
              step={1}
              className="w-20"
            />
            <Badge variant="outline">{brushSize}px</Badge>
          </div>

          {selectedTool === "eraser" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>Eraser:</span>
              <Slider
                value={[eraserSize]}
                onValueChange={([value]) => setEraserSize(value)}
                max={50}
                min={10}
                step={5}
                className="w-20"
              />
              <Badge variant="outline">{eraserSize}px</Badge>
            </div>
          )}

          <div style={{ width: "1px", height: "24px", background: "#ddd" }} />

          {/* History controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAnnotations}
            disabled={currentPageAnnotations.length === 0}
            title="Clear all annotations on this page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Annotation count */}
          {currentPageAnnotations.length > 0 && (
            <Badge variant="secondary">
              {currentPageAnnotations.length} annotation{currentPageAnnotations.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Annotation canvas */}
      <canvas
        ref={annotationCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "absolute",
          top: showControls ? "auto" : 0,
          left: 0,
          cursor: selectedTool === "select" ? "default" : 
                 selectedTool === "eraser" ? "crosshair" : 
                 "crosshair",
          zIndex: 15
        }}
      />
    </div>
  );
}
