// Unified type definitions for all PDF editor functionality

// ========== Core PDF Types ==========
export interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

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

export interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

// ========== Text Element Types ==========
export interface TextElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  value?: string; // for contentEditable compatibility
  fontSize: number;
  size?: number; // alias for fontSize
  fontFamily: string;
  font?: string; // alias for fontFamily
  color: string;
  fontWeight: "normal" | "bold";
  bold?: boolean; // convenience property
  fontStyle: "normal" | "italic";
  italic?: boolean; // convenience property
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
  rotation?: number;
}

// Legacy TextBox interface for backward compatibility
export type TextBox = TextElement;

// ========== Font Management Types ==========
export interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
}

// ========== Annotation Types ==========
export interface BaseAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "rectangle" | "circle" | "line";
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
}

export interface FreeformAnnotation extends BaseAnnotation {
  type: "freeform" | "signature";
  points: number[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  text: string;
  fontSize: number;
}

export interface MarkAnnotation extends BaseAnnotation {
  type: "checkmark" | "x-mark";
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  src: string;
}

export type Annotation = 
  | ShapeAnnotation 
  | HighlightAnnotation 
  | FreeformAnnotation 
  | TextAnnotation 
  | MarkAnnotation 
  | ImageAnnotation;

// Legacy annotation interface for backward compatibility
export interface AnnotationElement {
  id: string;
  type: "highlight" | "rectangle" | "circle" | "freeform" | "signature";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  page: number;
  strokeWidth?: number;
  points?: number[];
}

// ========== Form Field Types ==========
export interface FormField {
  id: string;
  name?: string;
  fieldName: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "signature";
  fieldType: string; // PDF internal field type
  value: string | boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  rect?: number[];
  options?: string[];
  radioGroup?: string;
  required?: boolean;
  readonly?: boolean;
}

// ========== Tool Types ==========
export type AnnotationTool = 
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
  | "line";

export type TextTool = "add" | "edit" | "select";

// ========== Color and Style Types ==========
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface StyleOptions {
  color: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
}

// ========== Canvas and Rendering Types ==========
export interface CanvasPoint {
  x: number;
  y: number;
}

export interface ViewportOptions {
  scale: number;
  rotation: number;
}

// ========== Invoice Types (from PDFToolkit) ==========
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

// ========== Event Handler Types ==========
export interface PDFEditorCallbacks {
  onTextElementsChange?: (elements: TextElement[]) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  onFormFieldsChange?: (fields: FormField[]) => void;
  onFileProcessed?: (file: PDFFile) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}

// ========== Component Props Types ==========
export interface BaseComponentProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentPage: number;
  zoom?: number;
  scale?: number;
  isActive?: boolean;
  showControls?: boolean;
}

export interface TextEditorProps extends BaseComponentProps {
  textElements?: TextElement[];
  onTextElementsChange?: (elements: TextElement[]) => void;
  addMode?: boolean;
  selectedFont?: string;
  fontSize?: number;
  fontColor?: string;
}

export interface AnnotationToolsProps extends BaseComponentProps {
  annotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  currentTool?: AnnotationTool;
  color?: string;
  strokeWidth?: number;
}

export interface PDFToolkitProps {
  onFileProcessed?: (file: PDFFile) => void;
  currentFile?: PDFFile;
  files?: PDFFile[];
}

export {
  PDFFile,
  PDFMergeOptions,
  PDFSplitOptions,
  SplitRange,
  TextElement,
  TextBox,
  FontInfo,
  Annotation,
  BaseAnnotation,
  ShapeAnnotation,
  HighlightAnnotation,
  FreeformAnnotation,
  TextAnnotation,
  MarkAnnotation,
  ImageAnnotation,
  FormField,
  AnnotationTool,
  TextTool,
  RGBColor,
  StyleOptions,
  CanvasPoint,
  ViewportOptions,
  InvoiceData,
  PDFEditorCallbacks,
  BaseComponentProps,
  TextEditorProps,
  AnnotationToolsProps,
  PDFToolkitProps
};