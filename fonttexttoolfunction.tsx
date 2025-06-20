import React, { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import styled from "styled-components";
import { PDFDocument } from "pdf-lib";
import { HexColorPicker } from "react-colorful";

// ================== Font Metadata Types ==================
export interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
}

// ================== Font Face Observer Polyfill ==================
class FontFaceObserver {
  family: string;
  constructor(family: string) {
    this.family = family;
  }
  load(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const testString = "BESbswy";
      const timeout = 3000;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas context not available"));
        return;
      }
      context.font = `12px monospace`;
      const fallbackWidth = context.measureText(testString).width;
      context.font = `12px "${this.family}", monospace`;
      const startTime = Date.now();
      const check = () => {
        const currentWidth = context.measureText(testString).width;
        if (currentWidth !== fallbackWidth) resolve(true);
        else if (Date.now() - startTime > timeout) reject(new Error("Font load timeout"));
        else setTimeout(check, 50);
      };
      check();
    });
  }
}

// ================== Font Paths for Font Loader ==================
const fontPaths: Record<string, string> = {
  "Arial": "/fonts/arial.ttf",
  "Helvetica": "/fonts/helvetica.ttf",
  "Times New Roman": "/fonts/times-new-roman.ttf",
  "Courier New": "/fonts/courier-new.ttf",
  "Verdana": "/fonts/verdana.ttf",
  "Georgia": "/fonts/georgia.ttf",
  "Trebuchet MS": "/fonts/trebuchet-ms.ttf",
  "Tahoma": "/fonts/tahoma.ttf",
  "Impact": "/fonts/impact.ttf",
  "Comic Sans MS": "/fonts/comic-sans-ms.ttf",
  "Roboto": "/fonts/roboto.ttf",
  "Open Sans": "/fonts/open-sans.ttf",
  "Lato": "/fonts/lato.ttf",
  "Montserrat": "/fonts/montserrat.ttf",
  "Oswald": "/fonts/oswald.ttf",
  "Raleway": "/fonts/raleway.ttf",
  "PT Sans": "/fonts/pt-sans.ttf",
  "Source Sans Pro": "/fonts/source-sans-pro.ttf",
  "Merriweather": "/fonts/merriweather.ttf",
  "Noto Sans": "/fonts/noto-sans.ttf",
  "Ubuntu": "/fonts/ubuntu.ttf",
  "Nunito": "/fonts/nunito.ttf",
  "Work Sans": "/fonts/work-sans.ttf",
  "Rubik": "/fonts/rubik.ttf",
  "Poppins": "/fonts/poppins.ttf",
  "Inter": "/fonts/inter.ttf",
  "Fira Sans": "/fonts/fira-sans.ttf",
  "Cabin": "/fonts/cabin.ttf",
  "Playfair Display": "/fonts/playfair-display.ttf",
  "Titillium Web": "/fonts/titillium-web.ttf",
  "Inconsolata": "/fonts/inconsolata.ttf",
  "IBM Plex Sans": "/fonts/ibm-plex-sans.ttf",
  "Quicksand": "/fonts/quicksand.ttf",
  "Assistant": "/fonts/assistant.ttf",
  "Mukta": "/fonts/mukta.ttf",
  "Arimo": "/fonts/arimo.ttf",
  "Karla": "/fonts/karla.ttf",
  "Josefin Sans": "/fonts/josefin-sans.ttf",
  "Manrope": "/fonts/manrope.ttf",
  "Zilla Slab": "/fonts/zilla-slab.ttf",
  "Space Grotesk": "/fonts/space-grotesk.ttf",
  "Barlow": "/fonts/barlow.ttf",
  "Cairo": "/fonts/cairo.ttf",
  "DM Sans": "/fonts/dm-sans.ttf",
  "Mulish": "/fonts/mulish.ttf",
  "Heebo": "/fonts/heebo.ttf",
  "Exo 2": "/fonts/exo-2.ttf",
  "Be Vietnam Pro": "/fonts/be-vietnam-pro.ttf",
  "Anton": "/fonts/anton.ttf"
};
export function getAvailableFontNames(): string[] {
  return Object.keys(fontPaths);
}
export function getFontPath(fontName: string): string | undefined {
  return fontPaths[fontName];
}
export async function loadFonts(pdfDoc: PDFDocument): Promise<Record<string, any>> {
  const fontMap: Record<string, any> = {};
  for (const [fontName, path] of Object.entries(fontPaths)) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const fontBytes = await response.arrayBuffer();
        const embeddedFont = await pdfDoc.embedFont(fontBytes);
        fontMap[fontName] = embeddedFont;
      }
    } catch {}
  }
  return fontMap;
}

// ================== Font Matching and Detection ==================
export async function detectFontFromBuffer(buffer: ArrayBuffer) {
  try {
    // Dynamically import opentype.js only if needed
    const opentype = await import('opentype.js');
    const font = opentype.parse(buffer);
    return {
      familyName: font.names.fullName?.en || 'Unknown',
      style: font.names.fontSubfamily?.en || 'Regular',
      weight: font.tables.os2?.usWeightClass || 400,
      isItalic: font.tables.post?.italicAngle !== 0,
    };
  } catch (err) {
    console.error('Font detection failed:', err);
    return null;
  }
}
export function matchFont(targetName: string, availableFonts: string[]): string {
  const lower = targetName.toLowerCase();
  const match = availableFonts.find(f => f.toLowerCase().includes(lower));
  return match || "Helvetica";
}

// ================== Font Selector Dropdown Tool ==================
export interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  fontList?: string[];
  style?: React.CSSProperties;
}
export const FontSelector: React.FC<FontSelectorProps> = ({
  value,
  onChange,
  fontList,
  style
}) => {
  const fonts = fontList || getAvailableFontNames();
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ minWidth: 160, ...style }}
    >
      {fonts.map(font =>
        <option key={font} value={font} style={{ fontFamily: font }}>
          {font}
        </option>
      )}
    </select>
  );
};

// ================== Font Toolbar ==================
export interface FontToolbarProps {
  onChange?: (state: { size: number; color: string; family: string }) => void;
  defaultSize?: number;
  defaultColor?: string;
  defaultFamily?: string;
}
export const FontToolbar: React.FC<FontToolbarProps> = ({
  onChange,
  defaultSize = 24,
  defaultColor = "#000000",
  defaultFamily = "Helvetica"
}) => {
  const [size, setSize] = useState<number>(defaultSize);
  const [color, setColor] = useState<string>(defaultColor);
  const [family, setFamily] = useState<string>(defaultFamily);

  useEffect(() => {
    if (onChange) {
      onChange({ size, color, family });
    }
  }, [size, color, family, onChange]);

  return (
    <ToolbarWrapper>
      <Label>
        Font Size:
        <select value={size} onChange={e => setSize(Number(e.target.value))}>
          {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(s => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
      </Label>
      <Label>
        Color:
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      </Label>
      <Label>
        Font:
        <FontSelector value={family} onChange={setFamily} />
      </Label>
    </ToolbarWrapper>
  );
};

// ================== Text Toolbar ==================
export interface TextToolbarProps {
  visible: boolean;
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  bold: boolean;
  setBold: Dispatch<SetStateAction<boolean>>;
  italic: boolean;
  setItalic: Dispatch<SetStateAction<boolean>>;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
}
export const TextToolbar: React.FC<TextToolbarProps> = ({
  visible,
  fontSize,
  setFontSize,
  bold,
  setBold,
  italic,
  setItalic,
  color,
  setColor
}) => {
  if (!visible) return null;
  return (
    <TextToolbarWrapper>
      <label>
        Font Size:
        <input
          type="number"
          min={8}
          max={72}
          value={fontSize}
          onChange={e => setFontSize(parseInt(e.target.value))}
        />
      </label>
      <button onClick={() => setBold(!bold)} style={{ fontWeight: bold ? 'bold' : 'normal' }}>
        Bold
      </button>
      <button onClick={() => setItalic(!italic)} style={{ fontStyle: italic ? 'italic' : 'normal' }}>
        Italic
      </button>
      <div>
        <span style={{ fontSize: '0.9rem' }}>Text Color:</span>
        <HexColorPicker color={color} onChange={setColor} />
      </div>
    </TextToolbarWrapper>
  );
};

// ================== Styles ==================
const ToolbarWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
  flex-wrap: wrap;
  justify-content: center;
  background-color: #1f2937;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
`;
const Label = styled.label`
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f3f4f6;
`;
const TextToolbarWrapper = styled.div`
  position: fixed;
  right: 20px;
  top: 100px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`