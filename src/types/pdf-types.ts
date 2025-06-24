// =======================
// PDF File Types
// =======================

interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

// =======================
// PDF Merge/Split Options
// =======================

interface PDFMergeOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}

interface PDFSplitOptions {
  outputFormat?: "separate" | "range";
  pageRanges?: Array<{ start: number; end: number }>;
  prefix?: string;
}

// =======================
// Split Range
// =======================

interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

// =======================
// Font Types
// =======================

interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
  fileUrl?: string; // for loaded fonts
}

// =======================
// Text/Annotation Types
// =======================

// Textbox
interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;         // Content-editable
  text?: string;          // Text content
  font: string;
  fontFamily?: string;    // Redundant but common
  size: number;           // Alias for fontSize
  fontSize: number;      // Alias for size
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontWeight?: string;    // or "normal" | "bold"
  fontStyle?: string;     // or "normal" | "italic"
  textAlign?: "left" | "center" | "right";
  rotation?: number;
}

// Text Element
interface TextElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  value?: string;            // For contentEditable compatibility, optional
  fontSize: number;
  size: number;             // Alias for fontSize, optional
  fontFamily: string;
  font?: string;             // Alias for fontFamily, optional
  color: string;
  fontWeight: "normal" | "bold";
  bold?: boolean;            // Convenience, optional
  fontStyle: "normal" | "italic";
  italic?: boolean;          // Convenience, optional
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
  rotation?: number;
}

// =======================
// Annotation Types
// =======================

// Base type for all annotation shapes (with optional subtypes)
interface Annotation {
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
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  strokeWidth: number;
  points: number[];      // For freeform/signature/line
  text?: string;          // For text annotation
  fontSize?: number;      // For text annotation
  src?: string;           // For image/signature
}

// **Optional**: specialized annotation element (for legacy/manager)
interface AnnotationElement {
  id?: string;
  type: "highlight" | "rectangle" | "circle" | "freeform" | "signature" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string | { r: number; g: number; b: number };
  page: number;
  strokeWidth: number;
  points: number[];
}

// =======================
// Form Field Types
// =======================

interface FormField {
  id: string;
  name?: string;
  fieldName?: string;   // PDF internal field name
  type?: "text" | "checkbox" | "radio" | "dropdown" | "signature";
  fieldType?: string;   // PDF internal field type
  value: string | boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  rect: number[];
  options?: string[];
  radioGroup?: string;
  required?: boolean;
  readonly?: boolean;
}

// =======================
// Invoice Types
// =======================

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

// =======================
// OCR Types
// =======================

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

// =======================
// Signature Types
// =======================

interface SignatureData {
  dataUrl: string;
  hash?: string;
}

interface SignatureToolProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  signatureDataUrl?: string;
  onPlace?: (placement: SignaturePlacement) => void;
}

interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page?: number;
}

interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  showCancel?: boolean;
  width: number;
  height: number;
}

// =======================
// Miscellaneous Types
// =======================

interface UsePDFOperationsOptions {
  onFileLoaded?: (file: PDFFile) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface PDFToolkitProps {
  onFileProcessed?: (file: PDFFile) => void;
  currentFile?: PDFFile;
}

// Font manager
interface FontManagerProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontWeight: "normal" | "bold";
  onFontWeightChange: (weight: "normal" | "bold") => void;
  fontStyle: "normal" | "italic";
  onFontStyleChange: (style: "normal" | "italic") => void;
  showAdvanced?: boolean;
}

// Annotation manager (UI)
interface AnnotationManagerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentPage: number;
  zoom: number;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  showControls?: boolean;
}

// =======================
// UI Dialog & Component Types
// =======================

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any, token: string) => void;
  onSwitchToSignup: () => void;
}

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any, token: string) => void;
}

export interface EditHistoryAction {
  type: "add" | "remove" | "update";
  annotationId: string;
  previousValue?: Annotation;
  newValue?: Annotation;
  timestamp: number;
}

interface AnnotationTool {
  // Basic CRUD
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  getAnnotation: (id: string) => Annotation | undefined;
  getAnnotations: (page?: number) => Annotation[];
  clearAnnotations: () => void;

  // Selection tools
  selectAnnotation: (id: string) => void;
  deselectAnnotation: () => void;
  getSelectedAnnotation: () => Annotation | undefined;

  // Bulk actions
  importAnnotations: (annotations: Annotation[]) => void;
  exportAnnotations: () => Annotation[];

  // Undo/Redo & Edit History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getEditHistory: () => EditHistoryAction[];
  clearEditHistory: () => void;

  // Utility
  moveAnnotation: (id: string, x: number, y: number) => void;
  resizeAnnotation: (id: string, width: number, height: number) => void;
  duplicateAnnotation: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

export type AnnotationToolName =
  | "select"
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


export type {
  PDFFile,
  PDFMergeOptions,
  PDFSplitOptions,
  SplitRange,
  FontInfo,
  TextBox,
  TextElement,
  Annotation,
  AnnotationElement,
  FormField,
  InvoiceData,
  OCRResult,
  OCRToolProps,
  OCRLanguage,
  SignatureData,
  SignatureToolProps,
  SignaturePlacement,
  SignaturePadProps,
  UsePDFOperationsOptions,
  PDFToolkitProps,
  FontManagerProps,
  AnnotationManagerProps,
  AnnotationTool,
};
