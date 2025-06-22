import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import { Button } from "../components/ui/button";
import { Trash2, Bold, Italic } from "lucide-react";

// Unified TextBox type (with all options)
export type TextBox = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string; // for contentEditable
  text?: string;  // for input editing
  font: string;
  fontFamily?: string;
  size: number;
  fontSize?: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
};

type AdvancedTextLayerProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  page: number;
  isActive?: boolean;
  addTextBox?: boolean;
  onTextBoxesChange?: (textBoxes: TextBox[]) => void;
  scale?: number;
};

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

export default function AdvancedTextLayer({
  canvasRef,
  page,
  isActive = true,
  addTextBox = false,
  onTextBoxesChange,
  scale = 1,
}: AdvancedTextLayerProps) {
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(addTextBox);
  const [selectedFont, setSelectedFont] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // Add new text box on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    if (isAddMode && e.target === e.currentTarget) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newBox: TextBox = {
        id: nanoid(),
        page,
        x,
        y,
        width: 200,
        height: 50,
        value: "",
        text: "",
        font: selectedFont,
        fontFamily: selectedFont,
        size: fontSize,
        fontSize: fontSize,
        color: fontColor,
        bold: false,
        italic: false,
        underline: false,
        fontWeight: "normal",
        fontStyle: "normal",
      };

      const updatedBoxes = [...textBoxes, newBox];
      setTextBoxes(updatedBoxes);
      onTextBoxesChange?.(updatedBoxes);
      setSelectedBoxId(newBox.id);
      setIsAddMode(false); // Optional: exit add mode after placing a box
    }
  };

  // Update box property (works for all fields)
  const updateBox = (id: string, props: Partial<TextBox>) => {
    const updatedBoxes = textBoxes.map((tb) =>
      tb.id === id ? { ...tb, ...props } : tb,
    );
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
  };

  // Remove a text box
  const deleteTextBox = (id: string) => {
    const updatedBoxes = textBoxes.filter((tb) => tb.id !== id);
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
    setSelectedBoxId(null);
  };

  // Toggle styles
  const toggleStyle = (id: string, style: "bold" | "italic" | "underline") => {
    updateBox(id, { [style]: !textBoxes.find(tb => tb.id === id)?.[style] });
  };

  // Handle inline (input) text change
  const handleInputTextChange = (id: string, val: string) => {
    updateBox(id, { text: val, value: val });
  };

  // Handle contentEditable blur (rich editing)
  const handleBlur = (id: string, val: string) => {
    updateBox(id, { value: val, text: val });
  };

  // Toolbar style for hover and selection
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Toolbar for adding and base settings */}
      <div
        style={{
          marginBottom: "0.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setIsAddMode(!isAddMode)}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: isAddMode ? "#3b82f6" : "#f8f9fa",
            color: isAddMode ? "white" : "#333",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {isAddMode ? "Cancel" : "Add Text"}
        </button>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          style={{
            padding: "4px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          {[...baseFonts, ...availableFonts].map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
        <input
          type="number"
          min={8}
          max={72}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
          style={{
            width: "60px",
            padding: "4px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
          style={{
            width: "40px",
            height: "32px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        />
      </div>

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
        {textBoxes
          .filter((box) => box.page === page)
          .map((box) => (
            <Rnd
              key={box.id}
              size={{ width: box.width * scale, height: box.height * scale }}
              position={{ x: box.x * scale, y: box.y * scale }}
              bounds="parent"
              onDragStop={(_, d) =>
                updateBox(box.id, { x: d.x / scale, y: d.y / scale })
              }
              onResizeStop={(_, __, ref, ____, pos) =>
                updateBox(box.id, {
                  width: parseInt(ref.style.width, 10) / scale,
                  height: parseInt(ref.style.height, 10) / scale,
                  x: pos.x / scale,
                  y: pos.y / scale,
                })
              }
              onClick={() => setSelectedBoxId(box.id)}
              style={{
                zIndex: selectedBoxId === box.id ? 50 : 30,
                position: "absolute",
                boxShadow: selectedBoxId === box.id ? "0 2px 12px #4FC3F770" : undefined,
              }}
            >
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                {/* Selected/hover toolbar */}
                {selectedBoxId === box.id && (
                  <div style={toolbarStyle} onClick={e => e.stopPropagation()}>
                    <span style={{ fontWeight: "bold", marginRight: 8 }}>Format:</span>
                    <select
                      value={box.font || selectedFont}
                      onChange={(e) => updateBox(box.id, { font: e.target.value, fontFamily: e.target.value })}
                      style={{
                        width: "120px", height: "24px", fontSize: "11px",
                        background: "white", color: "black", border: "1px solid #ddd", borderRadius: "3px"
                      }}
                    >
                      {[...baseFonts, ...availableFonts].map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={box.size || fontSize}
                      onChange={e =>
                        updateBox(box.id, { size: parseInt(e.target.value) || 16, fontSize: parseInt(e.target.value) || 16 })
                      }
                      style={{
                        width: "50px", height: "24px", padding: "2px 4px", border: "1px solid #ddd", borderRadius: "3px",
                        fontSize: "11px", background: "white", color: "black"
                      }}
                      min={8}
                      max={72}
                    />
                    <Button
                      variant={box.bold ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStyle(box.id, "bold")}
                      style={{ height: "24px", padding: "0 8px" }}
                    ><Bold className="h-3 w-3" /></Button>
                    <Button
                      variant={box.italic ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStyle(box.id, "italic")}
                      style={{ height: "24px", padding: "0 8px" }}
                    ><Italic className="h-3 w-3" /></Button>
                    <Button
                      variant={box.underline ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStyle(box.id, "underline")}
                      style={{ height: "24px", padding: "0 8px" }}
                    >U</Button>
                    {/* Color picker */}
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "20px", height: "20px", backgroundColor: box.color,
                          border: "2px solid #eee", borderRadius: "3px", cursor: "pointer"
                        }}
                        onClick={() =>
                          setShowColorPicker(showColorPicker === box.id ? null : box.id)
                        }
                        title="Click to change color"
                      />
                      {showColorPicker === box.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "25px",
                            right: "0",
                            zIndex: 1000,
                          }}
                        >
                          <HexColorPicker
                            color={box.color}
                            onChange={color => updateBox(box.id, { color })}
                            style={{ width: "150px", height: "100px" }}
                          />
                        </div>
                      )}
                    </div>
                    {/* Delete */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTextBox(box.id)}
                      style={{ height: "24px", padding: "0 8px", marginLeft: "8px" }}
                    ><Trash2 className="h-3 w-3" /></Button>
                  </div>
                )}

                {/* Rich/inline editable */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: box.font,
                    fontSize: box.size,
                    color: box.color,
                    fontWeight: box.bold ? "bold" : box.fontWeight,
                    fontStyle: box.italic ? "italic" : box.fontStyle,
                    textDecoration: box.underline ? "underline" : undefined,
                    background: "rgba(255,255,255,0.9)",
                    padding: "6px",
                    outline: selectedBoxId === box.id ? "2px solid #3b82f6" : "1px solid #ddd",
                    borderRadius: "3px",
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxSizing: "border-box",
                    cursor: "text",
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedBoxId(box.id);
                  }}
                  onBlur={e => handleBlur(box.id, e.currentTarget.innerText)}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.target as HTMLElement).blur();
                    }
                  }}
                >{box.value || box.text || ""}</div>
              </div>
            </Rnd>
          ))}
      </div>
    </div>
  );
}
