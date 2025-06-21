import { useState, useCallback, useRef } from "react";
import { pdfCore } from "../services/pdf-core";
import { 
  PDFFile, 
  TextElement, 
  Annotation, 
  FormField, 
  AnnotationTool 
} from "../types/pdf-types";

interface UsePDFOperationsOptions {
  onFileLoaded?: (file: PDFFile) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function usePDFOperations(options: UsePDFOperationsOptions = {}) {
  const [currentFile, setCurrentFile] = useState<PDFFile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF file
  const loadPDF = useCallback(async (file: File | ArrayBuffer) => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const pdfDoc = await pdfCore.loadPDF(file);
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
      
      const pdfFile: PDFFile = {
        id: `pdf-${Date.now()}`,
        name: file instanceof File ? file.name : "document.pdf",
        size: arrayBuffer.byteLength,
        data: arrayBuffer,
        pageCount: pdfDoc.numPages,
      };

      setCurrentFile(pdfFile);
      setCurrentPage(1);
      setLoadingProgress(50);

      // Load first page
      if (canvasRef.current) {
        await pdfCore.renderPage(pdfDoc, 1, canvasRef.current, zoom);
      }

      setLoadingProgress(100);
      options.onFileLoaded?.(pdfFile);
      
    } catch (error) {
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  }, [zoom, options]);

  // Render specific page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!currentFile || !canvasRef.current) return;

    try {
      const pdfDoc = await pdfCore.loadPDF(currentFile.data);
      await pdfCore.renderPage(pdfDoc, pageNum, canvasRef.current, zoom);
      setCurrentPage(pageNum);
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [currentFile, zoom, options]);

  // Navigate pages
  const goToPage = useCallback((pageNum: number) => {
    if (!currentFile) return;
    const clampedPage = Math.max(1, Math.min(pageNum, currentFile.pageCount || 1));
    renderPage(clampedPage);
  }, [currentFile, renderPage]);

  const nextPage = useCallback(() => {
    if (!currentFile) return;
    goToPage(Math.min(currentPage + 1, currentFile.pageCount || 1));
  }, [currentFile, currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(Math.max(currentPage - 1, 1));
  }, [currentPage, goToPage]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
    if (currentFile) {
      renderPage(currentPage);
    }
  }, [zoom, currentFile, currentPage, renderPage]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    if (currentFile) {
      renderPage(currentPage);
    }
  }, [zoom, currentFile, currentPage, renderPage]);

  const resetZoom = useCallback(() => {
    setZoom(1.5);
    if (currentFile) {
      renderPage(currentPage);
    }
  }, [currentFile, currentPage, renderPage]);

  // Text elements operations
  const addTextElement = useCallback((element: Omit<TextElement, "id">) => {
    const newElement: TextElement = {
      ...element,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTextElements(prev => [...prev, newElement]);
    return newElement;
  }, []);

  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  const removeTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
  }, []);

  // Annotation operations
  const addAnnotation = useCallback((annotation: Omit<Annotation, "id">) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as Annotation;
    setAnnotations(prev => [...prev, newAnnotation]);
    return newAnnotation;
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(ann => 
      ann.id === id ? { ...ann, ...updates } as Annotation : ann
    ));
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  }, []);

  const clearAnnotations = useCallback((pageNum?: number) => {
    if (pageNum) {
      setAnnotations(prev => prev.filter(ann => ann.page !== pageNum));
    } else {
      setAnnotations([]);
    }
  }, []);

  // Form field operations
  const detectFormFields = useCallback(async (pageNum?: number) => {
    if (!currentFile) return [];

    try {
      const pdfDoc = await pdfCore.loadPDF(currentFile.data);
      const targetPage = pageNum || currentPage;
      const fields = await pdfCore.detectFormFields(pdfDoc, targetPage);
      
      if (!pageNum) {
        setFormFields(fields);
      }
      
      return fields;
    } catch (error) {
      options.onError?.(error as Error);
      return [];
    }
  }, [currentFile, currentPage, options]);

  const updateFormField = useCallback((id: string, updates: Partial<FormField>) => {
    setFormFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  }, []);

  // Export operations
  const exportPDF = useCallback(async (filename?: string) => {
    if (!currentFile) return;

    try {
      setIsLoading(true);
      options.onProgress?.(10);

      const exportedPdfBytes = await pdfCore.exportWithAllElements(
        currentFile.data,
        textElements,
        formFields,
        annotations
      );

      options.onProgress?.(90);

      const blob = new Blob([exportedPdfBytes], { type: "application/pdf" });
      const downloadName = filename || `${currentFile.name}-edited.pdf`;
      pdfCore.downloadBlob(blob, downloadName);

      options.onProgress?.(100);
    } catch (error) {
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, textElements, formFields, annotations, options]);

  const exportTextOnly = useCallback(async (filename?: string) => {
    if (!currentFile) return;

    try {
      const exportedPdfBytes = await pdfCore.addTextElementsToPDF(
        currentFile.data,
        textElements
      );

      const blob = new Blob([exportedPdfBytes], { type: "application/pdf" });
      const downloadName = filename || `${currentFile.name}-text-only.pdf`;
      pdfCore.downloadBlob(blob, downloadName);
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [currentFile, textElements, options]);

  const exportAnnotationsOnly = useCallback(async (filename?: string) => {
    if (!currentFile) return;

    try {
      const exportedPdfBytes = await pdfCore.addAnnotationsToPDF(
        currentFile.data,
        annotations
      );

      const blob = new Blob([exportedPdfBytes], { type: "application/pdf" });
      const downloadName = filename || `${currentFile.name}-annotations-only.pdf`;
      pdfCore.downloadBlob(blob, downloadName);
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [currentFile, annotations, options]);

  // Extract text content
  const extractText = useCallback(async (pageNum?: number) => {
    if (!currentFile) return "";

    try {
      const pdfDoc = await pdfCore.loadPDF(currentFile.data);
      return await pdfCore.extractTextContent(pdfDoc, pageNum || currentPage);
    } catch (error) {
      options.onError?.(error as Error);
      return "";
    }
  }, [currentFile, currentPage, options]);

  // Get current page elements
  const getCurrentPageElements = useCallback(() => {
    return {
      textElements: textElements.filter(el => el.page === currentPage),
      annotations: annotations.filter(ann => ann.page === currentPage),
      formFields: formFields.filter(field => field.page === currentPage),
    };
  }, [textElements, annotations, formFields, currentPage]);

  return {
    // State
    currentFile,
    currentPage,
    zoom,
    textElements,
    annotations,
    formFields,
    selectedTool,
    isLoading,
    loadingProgress,
    canvasRef,

    // File operations
    loadPDF,
    renderPage,

    // Navigation
    goToPage,
    nextPage,
    prevPage,

    // Zoom
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,

    // Text elements
    addTextElement,
    updateTextElement,
    removeTextElement,
    setTextElements,

    // Annotations
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    setAnnotations,
    selectedTool,
    setSelectedTool,

    // Form fields
    detectFormFields,
    updateFormField,
    setFormFields,

    // Export
    exportPDF,
    exportTextOnly,
    exportAnnotationsOnly,

    // Utilities
    extractText,
    getCurrentPageElements,
  };
}

export default usePDFOperations;
