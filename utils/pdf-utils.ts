import { TextElement, Annotation, FormField, FontInfo, RGBColor } from "../types/pdf-types";

// ========== Color Utilities ==========
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ========== Font Utilities ==========
export const standardFonts: FontInfo[] = [
  {
    name: "Helvetica",
    family: "Helvetica",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Times-Roman",
    family: "Times",
    style: "normal", 
    weight: "normal",
    loaded: true,
  },
  {
    name: "Courier",
    family: "Courier",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Arial",
    family: "Arial", 
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Georgia",
    family: "Georgia",
    style: "normal",
    weight: "normal",
    loaded: true,
  }
];

export function matchFont(targetFont: string, availableFonts: FontInfo[]): string {
  // Try exact match first
  let match = availableFonts.find(
    (f) =>
      f.name.toLowerCase() === targetFont.toLowerCase() ||
      f.family.toLowerCase() === targetFont.toLowerCase(),
  );

  if (match) return match.name;

  // Try partial match
  match = availableFonts.find(
    (f) =>
      f.name.toLowerCase().includes(targetFont.toLowerCase()) ||
      targetFont.toLowerCase().includes(f.name.toLowerCase()),
  );

  if (match) return match.name;

  // Fallback mapping
  const fallbacks: { [key: string]: string } = {
    times: "Times-Roman",
    helvetica: "Helvetica", 
    courier: "Courier",
    arial: "Arial",
    "sans-serif": "Helvetica",
    serif: "Times-Roman",
    monospace: "Courier",
  };

  const fallback = fallbacks[targetFont.toLowerCase()];
  return fallback || "Helvetica";
}

// ========== Element Validation ==========
export function validateTextElement(element: Partial<TextElement>): string[] {
  const errors: string[] = [];
  
  if (!element.text && !element.value) {
    errors.push("Text content is required");
  }
  
  if (typeof element.x !== 'number' || element.x < 0) {
    errors.push("Valid X coordinate is required");
  }
  
  if (typeof element.y !== 'number' || element.y < 0) {
    errors.push("Valid Y coordinate is required");
  }
  
  if (typeof element.fontSize !== 'number' || element.fontSize < 1) {
    errors.push("Valid font size is required");
  }
  
  if (!element.fontFamily && !element.font) {
    errors.push("Font family is required");
  }
  
  if (!element.color || !/^#[0-9A-F]{6}$/i.test(element.color)) {
    errors.push("Valid color is required");
  }
  
  return errors;
}

export function validateAnnotation(annotation: Partial<Annotation>): string[] {
  const errors: string[] = [];
  
  if (!annotation.type) {
    errors.push("Annotation type is required");
  }
  
  if (typeof annotation.x !== 'number' || annotation.x < 0) {
    errors.push("Valid X coordinate is required");
  }
  
  if (typeof annotation.y !== 'number' || annotation.y < 0) {
    errors.push("Valid Y coordinate is required");
  }
  
  if (typeof annotation.width !== 'number' || annotation.width <= 0) {
    errors.push("Valid width is required");
  }
  
  if (typeof annotation.height !== 'number' || annotation.height <= 0) {
    errors.push("Valid height is required");
  }
  
  if (!annotation.color || !/^#[0-9A-F]{6}$/i.test(annotation.color)) {
    errors.push("Valid color is required");
  }
  
  return errors;
}

// ========== Coordinate Utilities ==========
export function getCanvasCoordinates(
  event: MouseEvent | React.MouseEvent,
  canvas: HTMLCanvasElement,
  scale: number = 1
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
  };
}

export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// ========== File Utilities ==========
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ========== Element Transformation ==========
export function normalizeTextElement(element: Partial<TextElement>): TextElement {
  return {
    id: element.id || generateUniqueId(),
    page: element.page || 1,
    x: element.x || 0,
    y: element.y || 0,
    width: element.width || 200,
    height: element.height || 50,
    text: element.text || element.value || "",
    value: element.value || element.text || "",
    fontSize: element.fontSize || element.size || 16,
    size: element.size || element.fontSize || 16,
    fontFamily: element.fontFamily || element.font || "Helvetica",
    font: element.font || element.fontFamily || "Helvetica",
    color: element.color || "#000000",
    fontWeight: element.fontWeight || (element.bold ? "bold" : "normal"),
    bold: element.bold ?? (element.fontWeight === "bold"),
    fontStyle: element.fontStyle || (element.italic ? "italic" : "normal"),
    italic: element.italic ?? (element.fontStyle === "italic"),
    underline: element.underline || false,
    textAlign: element.textAlign || "left",
    rotation: element.rotation || 0,
  };
}

export function normalizeAnnotation(annotation: Partial<Annotation>): Annotation {
  const baseAnnotation = {
    id: annotation.id || generateUniqueId(),
    page: annotation.page || 1,
    x: annotation.x || 0,
    y: annotation.y || 0,
    width: annotation.width || 100,
    height: annotation.height || 100,
    color: annotation.color || "#ffff00",
    strokeWidth: annotation.strokeWidth || 2,
  };

  switch (annotation.type) {
    case "text":
      return {
        ...baseAnnotation,
        type: "text",
        text: (annotation as any).text || "",
        fontSize: (annotation as any).fontSize || 16,
      };
    case "freeform":
    case "signature":
      return {
        ...baseAnnotation,
        type: annotation.type,
        points: (annotation as any).points || [],
      };
    default:
      return {
        ...baseAnnotation,
        type: annotation.type || "rectangle",
      } as Annotation;
  }
}

// ========== Canvas Drawing Utilities ==========
export function drawTextElement(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  scale: number = 1
): void {
  ctx.save();
  
  const x = element.x * scale;
  const y = element.y * scale;
  const fontSize = (element.fontSize || element.size || 16) * scale;
  
  ctx.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${fontSize}px ${element.fontFamily || element.font || 'Arial'}`;
  ctx.fillStyle = element.color;
  ctx.textAlign = (element.textAlign || 'left') as CanvasTextAlign;
  
  if (element.rotation) {
    ctx.translate(x, y);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.fillText(element.text || element.value || '', 0, fontSize);
  } else {
    ctx.fillText(element.text || element.value || '', x, y + fontSize);
  }
  
  if (element.underline) {
    const textWidth = ctx.measureText(element.text || element.value || '').width;
    ctx.beginPath();
    ctx.moveTo(x, y + fontSize + 2);
    ctx.lineTo(x + textWidth, y + fontSize + 2);
    ctx.strokeStyle = element.color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number = 1
): void {
  ctx.save();
  
  const x = annotation.x * scale;
  const y = annotation.y * scale;
  const width = annotation.width * scale;
  const height = annotation.height * scale;
  
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = annotation.strokeWidth * scale;
  
  switch (annotation.type) {
    case "rectangle":
      ctx.strokeRect(x, y, width, height);
      break;
      
    case "circle":
      ctx.beginPath();
      ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;
      
    case "highlight":
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, width, height);
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
        ctx.moveTo(annotation.points[0] * scale, annotation.points[1] * scale);
        for (let i = 2; i < annotation.points.length; i += 2) {
          ctx.lineTo(annotation.points[i] * scale, annotation.points[i + 1] * scale);
        }
        ctx.stroke();
      }
      break;
      
    case "text":
      if (annotation.text) {
        ctx.font = `${(annotation.fontSize || 16) * scale}px Arial`;
        ctx.fillText(annotation.text, x, y + (annotation.fontSize || 16) * scale);
      }
      break;
  }
  
  ctx.restore();
}

// ========== Export/Import Utilities ==========
export function exportElementsToJSON(
  textElements: TextElement[],
  annotations: Annotation[],
  formFields: FormField[]
): string {
  return JSON.stringify({
    textElements: textElements.map(normalizeTextElement),
    annotations: annotations.map(normalizeAnnotation),
    formFields,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importElementsFromJSON(jsonString: string): {
  textElements: TextElement[];
  annotations: Annotation[];
  formFields: FormField[];
} {
  try {
    const data = JSON.parse(jsonString);
    return {
      textElements: (data.textElements || []).map(normalizeTextElement),
      annotations: (data.annotations || []).map(normalizeAnnotation),
      formFields: data.formFields || [],
    };
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}
