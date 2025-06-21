import React, { useState, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import { Button } from "@ui/button";
import { Trash2, Bold, Italic, Type, Plus } from "lucide-react";
import { TextElement, TextEditorProps, FontInfo } from "@/types/pdf-types";

// Available fonts for text editing
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
];

const baseFonts = [
  "Helvetica",
  "Times New Roman", 
  "Courier New",
];

// FontFaceObserver for loading Google Fonts
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

export default function TextEditor({
  canvasRef,
  currentPage,
  zoom = 1,
  scale = 1,
  isActive = true,
  textElements = [],
  onTextElementsChange,
  addMode = false,
  selectedFont = "Helvetica",
  fontSize = 16,
  fontColor = "#000000",
  showControls = true
}: TextEditorProps) {
  const [elements, setElements] = useState<TextElement[]>(textElements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(addMode);
  const [currentFont, setCurrentFont] = useState(selectedFont);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [currentColor, setCurrentColor] = useState(fontColor);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [availableFontList, setAvailableFontList] = useState<FontInfo[]>([]);
  const [loadingFonts, setLoadingFonts] = useState(false);

  // Google Fonts list
  const googleFonts = [
    "Open Sans", "Roboto", "Lato", "Montserrat", "Source Sans Pro",
    "Raleway", "Ubuntu", "Nunito", "Poppins", "Merriweather"
  ];

  // Initialize standard fonts
  React.useEffect(() => {
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

  // Sync with parent component
  React.useEffect(() => {
    onTextElementsChange?.(elements);
  }, [elements, onTextElementsChange]);

  // Handle canvas click to add new text element
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !isAddMode) return;
    if (e.target !== e.currentTarget) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / (scale || zoom);
    const y = (e.clientY - rect.top) / (scale || zoom);

    const newElement: TextElement = {
      id: nanoid(),
      page: currentPage,
      x,
      y,
      width: 200,
      height: 50,
      text: "New Text",
      value: "New Text",
      fontSize: currentFontSize,
      size: currentFontSize,
      fontFamily: currentFont,
      font: currentFont,
      color: currentColor,
      fontWeight: "normal",
      bold: false,
      fontStyle: "normal",
      italic: false,
      underline: false,
      textAlign: "left",
      rotation: 0
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    setSelectedElementId(newElement.id);
    setIsAddMode(false);
  }, [isActive, isAddMode, canvasRef, scale, zoom, currentPage, currentFontSize, currentFont, currentColor, elements]);

  // Update element properties
  const updateElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElementId(null);
  }, []);

  // Toggle text styles
  const toggleStyle = useCallback((id: string, style: "bold" | "italic" | "underline") => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const updates: Partial<TextElement> = {};
    
    switch (style) {
      case "bold":
        updates.bold = !element.bold;
        updates.fontWeight = updates.bold ? "bold" : "normal";
        break;
      case "italic":
        updates.italic = !element.italic;
        updates.fontStyle = updates.italic ? "italic" : "normal";
        break;
      case "underline":
        updates.underline = !element.underline;
        break;
    }

    updateElement(id, updates);
  }, [elements, updateElement]);

  // Handle text content change
  const handleTextChange = useCallback((id: string, newText: string) => {
    updateElement(id, { text: newText, value: newText });
  }, [updateElement]);

  // Toolbar styles
  const toolbarStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "100%",
    left: "0",
    background: "#fff",
    padding: "8px 12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    borderRadius: "4px 4px 0 0",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: "320px",
    color: "black",
    fontSize: "12px",
  };

  const effectiveScale = scale || zoom;
  const pageElements = elements.filter(el => el.page === currentPage);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Controls toolbar */}
      {showControls && (
        <div style={{
          marginBottom: "0.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}>
          <Button
            onClick={() => setIsAddMode(!isAddMode)}
            variant={isAddMode ? "default" : "outline"}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {isAddMode ? "Cancel" : "Add Text"}
          </Button>

          <select
            value={currentFont}
            onChange={(e) => setCurrentFont(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "12px"
            }}
          >
            {availableFontList.map((font) => (
              <option key={font.name} value={font.name}>
                {font.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={8}
            max={72}
            value={currentFontSize}
            onChange={(e) => setCurrentFontSize(parseInt(e.target.value) || 16)}
            style={{
              width: "60px",
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "12px"
            }}
          />

          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            style={{
              width: "40px",
              height: "32px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          />

          {!loadingFonts && (
            <Button variant="outline" size="sm" onClick={loadMoreFonts}>
              <Type className="h-4 w-4 mr-1" />
              Load More Fonts
            </Button>
          )}
        </div>
      )}

      {/* Text elements overlay */}
      <div
        style={{
          position: "absolute",
          width: canvasRef.current?.width || "100%",
          height: canvasRef.current?.height || "100%",
          left: 0,
          top: 0,
          cursor: isAddMode ? "crosshair" : "default",
          zIndex: 10,
        }}
        onClick={handleCanvasClick}
      >
        {pageElements.map((element) => (
          <Rnd
            key={element.id}
            size={{ 
              width: element.width * effectiveScale, 
              height: element.height * effectiveScale 
            }}
            position={{ 
              x: element.x * effectiveScale, 
              y: element.y * effectiveScale 
            }}
            bounds="parent"
            onDragStop={(_, d) =>
              updateElement(element.id, { 
                x: d.x / effectiveScale, 
                y: d.y / effectiveScale 
              })
            }
            onResizeStop={(_, __, ref, ____, pos) =>
              updateElement(element.id, {
                width: parseInt(ref.style.width, 10) / effectiveScale,
                height: parseInt(ref.style.height, 10) / effectiveScale,
                x: pos.x / effectiveScale,
                y: pos.y / effectiveScale,
              })
            }
            onClick={() => setSelectedElementId(element.id)}
            style={{
              zIndex: selectedElementId === element.id ? 50 : 30,
              position: "absolute",
              boxShadow: selectedElementId === element.id ? "0 2px 12px #4FC3F770" : undefined,
            }}
          >
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              {/* Element toolbar */}
              {selectedElementId === element.id && (
                <div style={toolbarStyle} onClick={e => e.stopPropagation()}>
                  <span style={{ fontWeight: "bold", marginRight: 8 }}>Format:</span>
                  
                  <select
                    value={element.fontFamily || element.font}
                    onChange={(e) => updateElement(element.id, { 
                      fontFamily: e.target.value, 
                      font: e.target.value 
                    })}
                    style={{
                      width: "120px", height: "24px", fontSize: "11px",
                      background: "white", color: "black", border: "1px solid #ddd", borderRadius: "3px"
                    }}
                  >
                    {availableFontList.map((font) => (
                      <option key={font.name} value={font.name}>{font.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={element.fontSize || element.size}
                    onChange={e => {
                      const size = parseInt(e.target.value) || 16;
                      updateElement(element.id, { fontSize: size, size });
                    }}
                    style={{
                      width: "50px", height: "24px", padding: "2px 4px", 
                      border: "1px solid #ddd", borderRadius: "3px",
                      fontSize: "11px", background: "white", color: "black"
                    }}
                    min={8}
                    max={72}
                  />

                  <Button
                    variant={element.bold ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStyle(element.id, "bold")}
                    style={{ height: "24px", padding: "0 8px" }}
                  >
                    <Bold className="h-3 w-3" />
                  </Button>

                  <Button
                    variant={element.italic ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStyle(element.id, "italic")}
                    style={{ height: "24px", padding: "0 8px" }}
                  >
                    <Italic className="h-3 w-3" />
                  </Button>

                  <Button
                    variant={element.underline ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStyle(element.id, "underline")}
                    style={{ height: "24px", padding: "0 8px" }}
                  >
                    U
                  </Button>

                  {/* Color picker */}
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "20px", height: "20px", backgroundColor: element.color,
                        border: "2px solid #eee", borderRadius: "3px", cursor: "pointer"
                      }}
                      onClick={() =>
                        setShowColorPicker(showColorPicker === element.id ? null : element.id)
                      }
                      title="Click to change color"
                    />
                    {showColorPicker === element.id && (
                      <div style={{
                        position: "absolute",
                        top: "25px",
                        right: "0",
                        zIndex: 1000,
                      }}>
                        <HexColorPicker
                          color={element.color}
                          onChange={color => updateElement(element.id, { color })}
                          style={{ width: "150px", height: "100px" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteElement(element.id)}
                    style={{ height: "24px", padding: "0 8px", marginLeft: "8px" }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Editable text content */}
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange(element.id, e.currentTarget.textContent || '')}
                style={{
                  width: "100%",
                  height: "100%",
                  fontFamily: element.fontFamily || element.font,
                  fontSize: (element.fontSize || element.size) + 'px',
                  color: element.color,
                  fontWeight: element.bold ? "bold" : element.fontWeight,
                  fontStyle: element.italic ? "italic" : element.fontStyle,
                  textDecoration: element.underline ? "underline" : undefined,
                  textAlign: element.textAlign || "left",
                  background: "rgba(255,255,255,0.9)",
                  padding: "6px",
                  outline: selectedElementId === element.id ? "2px solid #3b82f6" : "1px solid #ddd",
                  borderRadius: "3px",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  cursor: "text"
                }}
              >
                {element.text || element.value}
              </div>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
