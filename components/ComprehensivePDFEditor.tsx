import React, { useRef, useState, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts, PageSizes, degrees, PDFFont, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfWorker";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// OCR imports
import OCRTool from "@components/OCRTool";
import { OCRResult } from "@/types/ocr";

// Signature imports
import SignatureTool from "@components/SignatureTool";
import { SignaturePlacement } from "@/types/signature"

// Import utilities from attached assets
import { cn } from "@utils/utils";
import { hexToRgb, rgbToHex, hexToRgbNormalized, commonColors } from "@/attached_assets/colorUtils";
import pdfCore from "@services/pdf-core";
import { detectFonts } from "@/attached_assets/fontDetector";
import FontManager from "@attached_assets/FontManager";
import PDFToolkit from "@attached_assets/PDFToolkit";

// Available fonts
const availableFonts = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Arial Black",
  "Impact",
  "Comic Sans MS",
  "Palatino",
  "Garamond",
  "Bookman",
  "Tahoma",
  "Lucida Console",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Source Sans Pro",
  "Raleway",
  "Ubuntu",
  "Nunito",
  "Poppins",
  "Merriweather"
];

const baseFonts = [
  "Helvetica",
  "Times New Roman",
  "Courier New",
];

// ========== TYPE DEFINITIONS ==========
interface TextBox {
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

interface Annotation {
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

interface FormField {
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

interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

interface InvoiceData {
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

interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
}
// ========== FONT FACE OBSERVER ==========
class FontFaceObserver {
  family: string;

  constructor(family: string) {
    this.family = family;
  }

  load() {
    return new Promise((resolve, reject) => {
      const testString = "BESbswy";
      const timeout = 3000;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const before = ctx.measureText(testString);
      ctx.font = `12px ${this.family}`;
      const after = ctx.measureText(testString);
      
      if (before.width !== after.width) {
        resolve(true);
      } else {
        setTimeout(() => reject(new Error('Font load timeout')), timeout);
      }
    });
  }
}

// ========== MAIN COMPONENT ==========
const ComprehensivePDFEditor = (props: { className?: string }) => { 

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Core PDF state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [renderingError, setRenderingError] = useState<string | null>(null);

  // Tools and modes
  const [currentTool, setCurrentTool] = useState<"select" | "text" | "highlight" | "rectangle" | "circle" | "freeform" | "form" | "signature" | "eraser" | "checkmark" | "x-mark" | "line" | "image">("select");
  const [activeTab, setActiveTab] = useState("edit");

  // Text elements state
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);

  // Text properties
  const [selectedFont, setSelectedFont] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState("#000000");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState("#ffff00");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);

  // Form fields state
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [detectedFormFields, setDetectedFormFields] = useState<FormField[]>([]);

  // PDF toolkit state
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [rotationAngle, setRotationAngle] = useState(90);

  // Color picker states
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showAnnotationColorPicker, setShowAnnotationColorPicker] = useState(false);

  // Font management
  const [availableFontList, setAvailableFontList] = useState<FontInfo[]>([]);
  const [loadingFonts, setLoadingFonts] = useState(false);

  // OCR state
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [showOCRPanel, setShowOCRPanel] = useState(false);

  // Signature state
  const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);

  // Google Fonts list
  const googleFonts = [
    "Open Sans", "Roboto", "Lato", "Montserrat", "Source Sans Pro",
    "Raleway", "Ubuntu", "Nunito", "Poppins", "Merriweather"
  ];

  // Initialize standard fonts
  useEffect(() => {
    const standardFonts: FontInfo[] = [
      ...baseFonts.map(font => ({
        name: font,
        family: font,
        style: "normal",
        weight: "normal",
        loaded: true
      })),
      ...availableFonts.map(font => ({
        name: font,
        family: font,
        style: "normal", 
        weight: "normal",
        loaded: true
      }))
    ];
    setAvailableFontList(standardFonts);
  }, []);

  // Load Google Font
  const loadGoogleFont = useCallback(async (fontName: string) => {
    try {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);

      await new FontFaceObserver(fontName).load();
      return true;
    } catch (error) {
      console.warn(`Failed to load font: ${fontName}`, error);
      return false;
    }
  }, []);

  // Load additional fonts
  const loadMoreFonts = useCallback(async () => {
    setLoadingFonts(true);
    const newFonts: FontInfo[] = [];

    for (const fontName of googleFonts) {
      const loaded = await loadGoogleFont(fontName);
      newFonts.push({
        name: fontName,
        family: fontName,
        style: "normal",
        weight: "normal",
        loaded,
        variants: ["300", "400", "500", "600", "700"]
      });
    }

    setAvailableFontList(prev => [...prev, ...newFonts]);
    setLoadingFonts(false);
  }, [loadGoogleFont, googleFonts]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      try {
        setIsLoading(true);
        setRenderingError(null);
        setFileName(file.name);

        const arrayBuffer = await file.arrayBuffer();
        setOriginalFileData(arrayBuffer);

        const pdf = await pdfCore.loadPDF(arrayBuffer);
        console.log("PDF loaded successfully, pages:", pdf.numPages);

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Render first page
        if (canvasRef.current) {
          await pdfCore.renderPage(pdf, 1, canvasRef.current, zoom / 100);
        }

        // Detect form fields
        const fields = await pdfCore.detectFormFields(pdf, 1);
        setDetectedFormFields(fields);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setRenderingError("Failed to load PDF. Please try a different file.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please select a valid PDF file");
    }
  };

  // Render PDF page
  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      setIsLoading(true);
      await pdfCore.renderPage(pdfDocument, pageNumber, canvasRef.current, zoom / 100);
      setCurrentPage(pageNumber);
      
      // Detect form fields for current page
      const fields = await pdfCore.detectFormFields(pdfDocument, pageNumber);
      setDetectedFormFields(fields);
    } catch (error) {
      console.error("Error rendering page:", error);
      setRenderingError("Failed to render page");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    renderPage(targetPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Zoom functions
  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 300);
    setZoom(newZoom);
    if (pdfDocument && canvasRef.current) {
      pdfCore.renderPage(pdfDocument, currentPage, canvasRef.current, newZoom / 100);
    }
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 25);
    setZoom(newZoom);
    if (pdfDocument && canvasRef.current) {
      pdfCore.renderPage(pdfDocument, currentPage, canvasRef.current, newZoom / 100);
    }
  };

  const resetZoom = () => {
    setZoom(100);
    if (pdfDocument && canvasRef.current) {
      pdfCore.renderPage(pdfDocument, currentPage, canvasRef.current, 1);
    }
  };

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
      annotationCanvas.style.pointerEvents = currentTool === "select" ? "none" : "auto";
      annotationCanvas.style.zIndex = "10";
    }
  }, [canvasRef, currentTool, zoom]);

  // Draw annotations
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
        ctx.lineWidth = annotation.strokeWidth * (zoom / 100);

        const x = annotation.x * (zoom / 100);
        const y = annotation.y * (zoom / 100);
        const width = annotation.width * (zoom / 100);
        const height = annotation.height * (zoom / 100);

        switch (annotation.type) {
          case "highlight":
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, y, width, height);
            break;

          case "rectangle":
            ctx.strokeRect(x, y, width, height);
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
                annotation.points[0] * (zoom / 100),
                annotation.points[1] * (zoom / 100),
              );
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(
                  annotation.points[i] * (zoom / 100),
                  annotation.points[i + 1] * (zoom / 100),
                );
              }
              ctx.stroke();
            }
            break;

          case "text":
            if (annotation.text) {
              ctx.font = `${(annotation.fontSize || 16) * (zoom / 100)}px Arial`;
              ctx.fillText(
                annotation.text,
                x,
                y + (annotation.fontSize || 16) * (zoom / 100),
              );
            }
            break;

          case "checkmark":
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2, y + height * 0.5);
            ctx.lineTo(x + width * 0.4, y + height * 0.7);
            ctx.lineTo(x + width * 0.8, y + height * 0.3);
            ctx.stroke();
            break;

          case "x-mark":
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2, y + height * 0.2);
            ctx.lineTo(x + width * 0.8, y + height * 0.8);
            ctx.moveTo(x + width * 0.8, y + height * 0.2);
            ctx.lineTo(x + width * 0.2, y + height * 0.8);
            ctx.stroke();
            break;

          case "signature":
            if (annotation.src) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, x, y, width, height);
              };
              img.src = annotation.src;
            }
            break;
        }

        ctx.restore();
      });
  }, [annotations, currentPage, zoom]);

  // Redraw annotations when they change
  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  // Get canvas coordinates from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (zoom / 100),
      y: (e.clientY - rect.top) / (zoom / 100),
    };
  }, [zoom]);

  // Canvas mouse event handlers
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === "text" && isAddingText) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / (zoom / 100);
      const y = (e.clientY - rect.top) / (zoom / 100);

      const newTextBox: TextBox = {
        id: nanoid(),
        page: currentPage,
        x,
        y,
        width: 200,
        height: 50,
        value: "New Text",
        text: "New Text",
        font: selectedFont,
        fontFamily: selectedFont,
        size: fontSize,
        fontSize: fontSize,
        color: textColor,
        bold: fontWeight === "bold",
        italic: fontStyle === "italic",
        underline: false,
        fontWeight,
        fontStyle,
      };

      setTextBoxes(prev => [...prev, newTextBox]);
      setSelectedTextBoxId(newTextBox.id);
      setIsAddingText(false);
    }
  }, [currentTool, isAddingText, canvasRef, zoom, currentPage, selectedFont, fontSize, textColor, fontWeight, fontStyle]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool === "select") return;

    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (currentTool === "freeform" || currentTool === "signature") {
      setCurrentPath([point.x, point.y]);
    }
  }, [currentTool, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint(e);

    if (currentTool === "freeform" || currentTool === "signature") {
      setCurrentPath((prev) => [...prev, point.x, point.y]);

      // Draw temporary path
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentPath.length > 2) {
        ctx.strokeStyle = annotationColor;
        ctx.lineWidth = strokeWidth * (zoom / 100);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(
          currentPath[currentPath.length - 4] * (zoom / 100),
          currentPath[currentPath.length - 3] * (zoom / 100),
        );
        ctx.lineTo(point.x * (zoom / 100), point.y * (zoom / 100));
        ctx.stroke();
      }
    }
  }, [isDrawing, startPoint, currentTool, currentPath, annotationColor, strokeWidth, zoom, getCanvasPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || currentTool === "select") return;

    const point = getCanvasPoint(e);
    const newId = nanoid();

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
          color: annotationColor,
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
          color: annotationColor,
          strokeWidth,
          page: currentPage,
        };
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
          color: annotationColor,
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
            color: annotationColor,
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

    setAnnotations(prev => [...prev, newAnnotation]);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPath([]);
  }, [isDrawing, startPoint, currentTool, getCanvasPoint, annotationColor, strokeWidth, currentPage, currentPath]);

  // Update text box
  const updateTextBox = useCallback((id: string, updates: Partial<TextBox>) => {
    setTextBoxes(prev => prev.map(box => 
      box.id === id ? { ...box, ...updates } : box
    ));
  }, []);

  // Delete text box
  const deleteTextBox = useCallback((id: string) => {
    setTextBoxes(prev => prev.filter(box => box.id !== id));
    setSelectedTextBoxId(null);
  }, []);

  // Toggle text styles
  const toggleTextStyle = useCallback((id: string, style: "bold" | "italic" | "underline") => {
    const textBox = textBoxes.find(box => box.id === id);
    if (!textBox) return;

    const updates: Partial<TextBox> = {};
    
    switch (style) {
      case "bold":
        updates.bold = !textBox.bold;
        updates.fontWeight = updates.bold ? "bold" : "normal";
        break;
      case "italic":
        updates.italic = !textBox.italic;
        updates.fontStyle = updates.italic ? "italic" : "normal";
        break;
      case "underline":
        updates.underline = !textBox.underline;
        break;
    }

    updateTextBox(id, updates);
  }, [textBoxes, updateTextBox]);

  // Handle text content change
  const handleTextChange = useCallback((id: string, newText: string) => {
    updateTextBox(id, { text: newText, value: newText });
  }, [updateTextBox]);

  // OCR handlers
  const handleOCRTextDetected = useCallback((results: OCRResult[]) => {
    setOcrResults(results);
  }, []);

  const handleOCRTextBoxCreate = useCallback((x: number, y: number, text: string) => {
    const newTextBox: TextBox = {
      id: nanoid(),
      page: currentPage,
      x,
      y,
      width: Math.max(200, text.length * 8),
      height: 30,
      value: text,
      text: text,
      font: selectedFont,
      fontFamily: selectedFont,
      size: fontSize,
      fontSize: fontSize,
      color: textColor,
      bold: fontWeight === "bold",
      italic: fontStyle === "italic",
      underline: false,
      fontWeight,
      fontStyle,
    };

    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedTextBoxId(newTextBox.id);
  }, [currentPage, selectedFont, fontSize, textColor, fontWeight, fontStyle]);

  const handleOCRTextExtracted = useCallback((text: string) => {
    // Optional: Handle extracted text for other purposes
    console.log("OCR extracted text:", text);
  }, []);

  // Signature handlers
  const handleSignatureSaved = useCallback((dataUrl: string) => {
    setCurrentSignature(dataUrl);
  }, []);

  const handleSignaturePlaced = useCallback((placement: SignaturePlacement) => {
    const signatureWithPage = { ...placement, page: currentPage };
    setSignatures(prev => [...prev, signatureWithPage]);
    
    // Create annotation for the signature
    const signatureAnnotation: Annotation = {
      id: nanoid(),
      type: "signature",
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      color: "#000000",
      strokeWidth: 1,
      page: currentPage,
      src: placement.src
    };
    
    setAnnotations(prev => [...prev, signatureAnnotation]);
  }, [currentPage]);

  const handleSignatureComplete = useCallback((dataUrl: string) => {
    setCurrentSignature(dataUrl);
    setCurrentTool("signature");
  }, []);

  const handleSignatureClose = useCallback(() => {
    setShowSignaturePanel(false);
    setCurrentSignature(null);
    setCurrentTool("select");
  }, []);

  // Export functions would go here...
  const exportPDF = useCallback(async () => {
    if (!originalFileData) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(25);
      const exportedPdfBytes = await pdfCore.exportWithAllElements(
        originalFileData,
        textBoxes,
        detectedFormFields,
        annotations
      );
      setProgress(75);

      const blob = new Blob([new Uint8Array(exportedPdfBytes)], { type: "application/pdf" });
      pdfCore.downloadBlob(blob, `${fileName.replace('.pdf', '')}-edited.pdf`);
      setProgress(100);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [originalFileData, textBoxes, detectedFormFields, annotations, fileName]);

   return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">PDF Editor</h1>
            {fileName && (
              <span className="text-sm text-gray-500">
                {fileName} {totalPages > 0 && `(${totalPages} pages)`}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload PDF
            </button>
            {originalFileData && (
              <button
                onClick={exportPDF}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with tabs */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-6 gap-1 mb-4">
              {["edit", "toolkit", "ocr", "signature", "forms", "export"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-1 text-xs rounded ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "ocr" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">OCR Text Recognition</h3>
                <OCRTool
                  pdfDocument={pdfDocument}
                  canvasRef={canvasRef}
                  currentPage={currentPage}
                  onTextDetected={handleOCRTextDetected}
                  onTextBoxCreate={handleOCRTextBoxCreate}
                  onTextExtracted={handleOCRTextExtracted}
                />

                {ocrResults.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="text-xs font-semibold mb-2">OCR Results Summary</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Text regions found:</span>
                        <span className="font-medium">{ocrResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average confidence:</span>
                        <span className="font-medium">
                          {Math.round(
                            ocrResults.reduce((acc, r) => acc + r.confidence, 0) / ocrResults.length
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "signature" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Digital Signature</h3>
                <SignatureTool
                  onSave={handleSignatureSaved}
                  onComplete={handleSignatureComplete}
                  onPlace={handleSignaturePlaced}
                  onClose={handleSignatureClose}
                  signatureDataUrl={currentSignature ?? undefined}
                />

                {signatures.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="text-xs font-semibold mb-2">Placed Signatures</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {signatures.map((sig, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded text-xs"
                        >
                          <div>
                            <div className="font-medium">Signature {index + 1}</div>
                            <div className="text-gray-500">
                              Page {sig.page}, Position: ({Math.round(sig.x)}, {Math.round(sig.y)})
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSignatures((prev) => prev.filter((_, i) => i !== index));
                              setAnnotations((prev) =>
                                prev.filter(
                                  (a) =>
                                    !(
                                      a.type === "signature" &&
                                      a.x === sig.x &&
                                      a.y === sig.y
                                    )
                                )
                              );
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Export Options</h3>
                <button
                  onClick={exportPDF}
                  disabled={!originalFileData || isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Export Complete PDF
                </button>

                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-xs font-semibold mb-2">Document Statistics</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Pages:</span>
                      <span>{totalPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Text Elements:</span>
                      <span>{textBoxes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annotations:</span>
                      <span>{annotations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signatures:</span>
                      <span>{signatures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OCR Results:</span>
                      <span>{ocrResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Form Fields:</span>
                      <span>{detectedFormFields.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main PDF viewer */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* Controls */}
          <div className="bg-white border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  ←
                </button>

                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  →
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button onClick={zoomOut} className="px-2 py-1 border rounded">
                  -
                </button>
                <span className="text-sm w-12 text-center">
                  {Math.round(zoom)}%
                </span>
                <button onClick={zoomIn} className="px-2 py-1 border rounded">
                  +
                </button>
                <button onClick={resetZoom} className="px-2 py-1 border rounded">
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="bg-white border-b border-gray-200 p-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">
                Processing... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            {renderingError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading PDF
                  </h3>
                  <p className="text-gray-500 mb-4">{renderingError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded"
                  >
                    Try Another File
                  </button>
                </div>
              </div>
            ) : !pdfDocument ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    📄
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No PDF Loaded
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload a PDF file to start editing
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Upload PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="relative bg-white shadow-lg"
                  style={{
                    width: `${canvasRef.current?.width || 0}px`,
                    height: `${canvasRef.current?.height || 0}px`,
                  }}
                >
                  {/* PDF Canvas */}
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0"
                    style={{ zIndex: 1 }}
                  />

                  {/* Annotation Canvas */}
                  <canvas
                    ref={annotationCanvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    style={{
                      zIndex: 2,
                      pointerEvents: currentTool === "select" ? "none" : "auto",
                    }}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />

                  {/* Text Boxes Layer */}
                  <div className="absolute top-0 left-0" style={{ zIndex: 3 }}>
                    {textBoxes
                      .filter((box) => box.page === currentPage)
                      .map((box) => (
                        <Rnd
                          key={box.id}
                          position={{
                            x: box.x * (zoom / 100),
                            y: box.y * (zoom / 100),
                          }}
                          size={{
                            width: box.width * (zoom / 100),
                            height: box.height * (zoom / 100),
                          }}
                          onDragStop={(e, data) => {
                            updateTextBox(box.id, {
                              x: data.x / (zoom / 100),
                              y: data.y / (zoom / 100),
                            });
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            updateTextBox(box.id, {
                              width: parseInt(ref.style.width) / (zoom / 100),
                              height: parseInt(ref.style.height) / (zoom / 100),
                              x: position.x / (zoom / 100),
                              y: position.y / (zoom / 100),
                            });
                          }}
                          bounds="parent"
                          className={`border ${
                            selectedTextBoxId === box.id
                              ? "border-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          <textarea
                            value={box.text || box.value || ""}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              handleTextChange(box.id, e.target.value)
                            }
                            onFocus={() => setSelectedTextBoxId(box.id)}
                            style={{
                              width: "100%",
                              height: "100%",
                              fontSize: `${
                                typeof box.fontSize === "number"
                                  ? box.fontSize * (zoom / 100)
                                  : typeof box.size === "number"
                                  ? box.size * (zoom / 100)
                                  : 16 * (zoom / 100)
                              }px`,
                              fontFamily: box.fontFamily || box.font || "sans-serif",
                              color: box.color || "#000",
                              fontWeight: box.fontWeight || "normal",
                              fontStyle: box.fontStyle || "normal",
                              textDecoration: box.underline ? "underline" : "none",
                              border: "none",
                              outline: "none",
                              resize: "none" as "none",
                              background: "transparent",
                            }}
                          />
                        </Rnd>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePDFEditor; 