import React, { useState, useRef } from "react";
import styled from "styled-components";
import { PDFDocument, StandardFonts } from "pdf-lib";

/**
 * PageActions
 * 
 * Lets users delete or insert a blank page in a PDF.
 * 
 * @prop {Uint8Array} pdfBytes - The PDF file bytes to modify.
 * @prop {number} currentPage - The (1-based) index of the currently viewed page.
 * @prop {function} setPdfBytes - Callback to update the PDF file after changes.
 * 
 * @example
 * <PageActions pdfBytes={bytes} currentPage={1} setPdfBytes={setPdfBytes} />
 */
export function PageActions({
  pdfBytes,
  currentPage,
  setPdfBytes
}: {
  pdfBytes: Uint8Array;
  currentPage: number;
  setPdfBytes: (bytes: Uint8Array) => void;
}) {
  const handleDelete = async () => {
    const updated = await deletePage(pdfBytes, currentPage - 1);
    setPdfBytes(updated);
  };

  const handleInsert = async () => {
    const updated = await insertBlankPage(pdfBytes, currentPage);
    setPdfBytes(updated);
  };

  return (
    <Panel>
      <ActionButton onClick={handleDelete}>🗑 Delete Page {currentPage}</ActionButton>
      <ActionButton onClick={handleInsert}>➕ Insert Blank After</ActionButton>
    </Panel>
  );
}

// Styled components for panel/buttons
const Panel = styled.div`
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  @media (prefers-color-scheme: dark) {
    background: #222;
    color: white;
  }
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.75rem;
  border: none;
  background: #444;
  color: #fff;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #111;
  }
`;


export function PageReorder({ onReordered }: { onReordered?: (bytes: Uint8Array) => void }) {
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  const handleFileLoad = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);

      setPdfBytes(bytes);
      setPageCount(pdfDoc.getPageCount());
      setOrder(Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i));
    };

    input.click();
  };

  const reorderPages = async () => {
    if (!pdfBytes || order.length === 0) return;
    const originalPdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    for (const i of order) {
      const [copied] = await newPdf.copyPages(originalPdf, [i]);
      newPdf.addPage(copied);
    }

    const finalPdf = await newPdf.save();
    onReordered && onReordered(new Uint8Array(finalPdf));
  };

  const handleDrag = (dragIndex: number, hoverIndex: number) => {
    const updated = [...order];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, moved);
    setOrder(updated);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button onClick={handleFileLoad} style={{ marginBottom: "1rem" }}>
        📂 Load PDF
      </button>
      {order.length > 0 && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {order.map((index, i) => (
              <DraggableCard
                key={i}
                index={i}
                label={`Page ${index + 1}`}
                onDrag={(targetIndex: number) => handleDrag(i, targetIndex)}
              />
            ))}
          </div>
          <button
            onClick={reorderPages}
            style={{
              marginTop: "1rem",
              padding: "10px 16px",
              background: "#00cec9",
              color: "#fff"
            }}
          >
            🔀 Export Reordered PDF
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * DraggableCard
 * 
 * Internal drag-and-drop helper for PageReorder.
 * 
 * @ignore
 */
function DraggableCard({
  index,
  label,
  onDrag
}: {
  index: number;
  label: string;
  onDrag: (hoverIndex: number) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => setDragging(true)}
      onDragOver={e => {
        e.preventDefault();
        if (!dragging) onDrag(index);
      }}
      onDragEnd={() => setDragging(false)}
      style={{
        padding: "10px 14px",
        border: "1px solid #aaa",
        borderRadius: "6px",
        background: "#fff",
        cursor: "move",
        minWidth: "80px",
        textAlign: "center"
      }}
    >
      {label}
    </div>
  );
}

// --- PDF Page Tools (ported from JS, now typed) ---

/**
 * Delete a page from a PDF by index (0-based).
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param pageIndex Page to delete (zero-based)
 * @returns New PDF bytes as Uint8Array
 */
export async function deletePage(pdfBytes: Uint8Array, pageIndex: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  if (pageIndex < 0 || pageIndex >= pageCount) throw new Error("Invalid page index");
  pdfDoc.removePage(pageIndex);
  return await pdfDoc.save();
}

/**
 * Insert a blank page at a given index.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param atIndex Insert at this index (zero-based)
 * @returns New PDF bytes as Uint8Array
 */
export async function insertBlankPage(pdfBytes: Uint8Array, atIndex: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const { width, height } = pdfDoc.getPage(0).getSize();
  pdfDoc.insertPage(atIndex, [width, height]);
  return await pdfDoc.save();
}

/**
 * Reorder pages in a PDF according to new order of page indices.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param newOrder Array of zero-based page indices in desired order
 * @returns New PDF bytes as Uint8Array
 */
export async function reorderPages(pdfBytes: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const copied = await PDFDocument.create();
  for (let i of newOrder) {
    const [page] = await copied.copyPages(pdfDoc, [i]);
    copied.addPage(page);
  }
  return await copied.save();
}

export function PdfDrawTool({ onDraw }: { onDraw?: (blob: Blob) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setPaths([...paths, [{ x: offsetX, y: offsetY }]]);
    setDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const newPaths = [...paths];
    newPaths[newPaths.length - 1].push({ x: offsetX, y: offsetY });
    setPaths(newPaths);
    redraw(newPaths);
  };

  const handleMouseUp = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (onDraw && blob) onDraw(blob);
    });
  };

  const redraw = (allPaths: { x: number; y: number }[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    allPaths.forEach(path => {
      ctx.beginPath();
      path.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={1000}
      style={{ border: "1px solid #ccc", cursor: "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

/**
 * StickyNoteTool
 * 
 * Double-click to create draggable, editable sticky notes on a page.
 *
 * @prop {Array} notes - Array of sticky note objects: {id, x, y, text}.
 * @prop {function} setNotes - Callback to update notes array.
 * 
 * @example
 * <StickyNoteTool notes={notes} setNotes={setNotes} />
 */
export function StickyNoteTool({
  notes,
  setNotes
}: {
  notes: { id: number; x: number; y: number; text: string }[];
  setNotes: React.Dispatch<React.SetStateAction<{ id: number; x: number; y: number; text: string }[]>>;
}) {
  const [draggingNote, setDraggingNote] = useState<number | null>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    const newNote = {
      id: Date.now(),
      x,
      y,
      text: "New note..."
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const updateNote = (id: number, text: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)));
  };

  const dragStart = (id: number) => setDraggingNote(id);

  const dragEnd = () => setDraggingNote(null);

  const drag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNote) return;
    const newX = e.clientX;
    const newY = e.clientY;
    setNotes((prev) =>
      prev.map((note) => (note.id === draggingNote ? { ...note, x: newX, y: newY } : note))
    );
  };

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      onDoubleClick={handleDoubleClick}
      onMouseMove={drag}
      onMouseUp={dragEnd}
    >
      {notes.map((note) => (
        <Note
          key={note.id}
          style={{ left: note.x, top: note.y }}
          onMouseDown={() => dragStart(note.id)}
        >
          <textarea
            value={note.text}
            onChange={(e) => updateNote(note.id, e.target.value)}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "transparent",
              resize: "none",
              outline: "none"
            }}
          />
        </Note>
      ))}
    </div>
  );
}

// Styled Note for StickyNoteTool
const Note = styled.div`
  position: absolute;
  min-width: 150px;
  min-height: 100px;
  background: #fffcab;
  border: 1px solid #d2cb00;
  padding: 0.5rem;
  font-size: 0.85rem;
  resize: both;
  overflow: auto;
  z-index: 1001;
`;

/**
 * SavePDFButton
 * 
 * Button to save/download the currently edited PDF (with new text blocks) as a file.
 *
 * @prop {Uint8Array} pdfBytes - The PDF file bytes to save.
 * @prop {Array} textBlocks - Array of text block objects: {str, transform: [..., x, y]}.
 * @prop {number} pageHeight - Height of the page (for y-coord calculation).
 * 
 * @example
 * <SavePDFButton pdfBytes={pdfBytes} textBlocks={blocks} pageHeight={height} />
 */
export function SavePDFButton({
  pdfBytes,
  textBlocks,
  pageHeight
}: {
  pdfBytes: Uint8Array;
  textBlocks: { str: string; transform: number[] }[];
  pageHeight: number;
}) {
  const handleSave = async () => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);

    for (let i = 0; i < textBlocks.length; i++) {
      const tb = textBlocks[i];
      const [a, , , , x, y] = tb.transform;

      page.drawText(tb.str, {
        x,
        y: pageHeight - y,
        size: a,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: undefined
      });
    }

    const updatedPdf = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(updatedPdf)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "edited.pdf";
    link.click();
  };

  return (
    <button
      onClick={handleSave}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "#222",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "0.75rem 1.25rem",
        fontWeight: "bold",
        cursor: "pointer",
        zIndex: 1000
      }}
    >
      Save PDF
    </button>
  );
}

/**
 * encryptPdfWithPassword (placeholder)
 * 
 * Throws error - pdf-lib does not support password encryption.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param userPassword User password
 * @throws {Error} Always, feature not supported.
 */
export async function encryptPdfWithPassword(pdfBytes: Uint8Array, userPassword: string): Promise<never> {
  throw new Error("Password protection for PDFs is not currently supported in pdf-lib.");
}

/**
 * extractPagesFromPdf
 * 
 * Extracts selected pages from a PDF into a new PDF.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param pageIndices Array of zero-based page indices to extract
 * @returns New PDF bytes as Uint8Array
 */
export async function extractPagesFromPdf(pdfBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

/**
 * reorderPdfPages
 * 
 * Reorders pages in a PDF by a new order of indices.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param newOrder Array of indices in desired order
 * @returns New PDF bytes as Uint8Array
 */
export async function reorderPdfPages(pdfBytes: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const reorderedPdf = await PDFDocument.create();
  const copiedPages = await reorderedPdf.copyPages(pdfDoc, newOrder);
  copiedPages.forEach((page) => reorderedPdf.addPage(page));
  return await reorderedPdf.save();
}

/**
 * removePdfPages
 * 
 * Removes specific pages from a PDF.
 * 
 * @param pdfBytes PDF file as Uint8Array
 * @param pageIndicesToRemove Array of indices to remove
 * @returns New PDF bytes as Uint8Array
 */
export async function removePdfPages(pdfBytes: Uint8Array, pageIndicesToRemove: number[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !pageIndicesToRemove.includes(i)
  );
  return await reorderPdfPages(pdfBytes, keepIndices);
}

/**
 * appendPdf
 * 
 * Appends all pages of a second PDF to the end of the first PDF.
 * 
 * @param originalPdfBytes First PDF as Uint8Array
 * @param pdfToAddBytes Second PDF as Uint8Array
 * @returns New PDF bytes as Uint8Array
 */
export async function appendPdf(originalPdfBytes: Uint8Array, pdfToAddBytes: Uint8Array): Promise<Uint8Array> {
  const mainPdf = await PDFDocument.load(originalPdfBytes);
  const additionalPdf = await PDFDocument.load(pdfToAddBytes);
  const copiedPages = await mainPdf.copyPages(additionalPdf, additionalPdf.getPageIndices());
  copiedPages.forEach((page) => mainPdf.addPage(page));
  return await mainPdf.save();
};
