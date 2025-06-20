import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import SignatureCanvas from "react-signature-canvas";
import styled from "styled-components";
import { sha256 } from "js-sha256";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import Tesseract from "tesseract.js";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Utility function
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

// Types
interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface Annotation {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  page: number;
  points?: number[];
  src?: string;
}

interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  page: number;
}

interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page: number;
}

// Styled components
const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  justify-content: between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  ` : `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover { background: #e5e7eb; }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabContainer = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  
  ${props => props.active ? `
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  ` : `
    color: #6b7280;
    &:hover { color: #374151; }
  `}
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  padding: 16px;
`;

const CanvasArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f3f4f6;
  overflow: auto;
  padding: 16px;
`;

const CanvasContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
`;

const PDFCanvas = styled.canvas`
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
`;

const AnnotationCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
`;

const TextElement = styled.div<{ selected: boolean }>`
  position: absolute;
  border: 2px dashed ${props => props.selected ? '#3b82f6' : 'transparent'};
  min-width: 20px;
  min-height: 20px;
  cursor: text;
  
  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  
  textarea {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    resize: none;
    padding: 2px;
    font-family: inherit;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
`;

// OCR Component
const OCRTool: React.FC<{
  onTextDetected?: (results: OCRResult[]) => void;
  onTextExtracted?: (text: string) => void;
}> = ({ onTextDetected, onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageOCR = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsProcessing(true);
      setProgress(0);
      
      try {
        const worker = await Tesseract.createWorker('eng');
        const { data } = await worker.recognize(file, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        });
        
        setExtractedText(data.text);
        onTextExtracted?.(data.text);
        await worker.terminate();
      } catch (error) {
        console.error('OCR failed:', error);
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    };
    
    input.click();
  };

  return (
    <Card>
      <CardTitle>OCR Text Recognition</CardTitle>
      <Button variant="primary" onClick={handleImageOCR} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Extract Text from Image'}
      </Button>
      
      {isProcessing && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: '#3b82f6', 
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {progress}% complete
          </p>
        </div>
      )}
      
      {extractedText && (
        <textarea
          value={extractedText}
          onChange={e => setExtractedText(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            marginTop: '12px',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px'
          }}
          placeholder="Extracted text will appear here..."
        />
      )}
    </Card>
  );
};

// Signature Component
const SignatureTool: React.FC<{
  onSignatureComplete?: (dataUrl: string) => void;
  onSignaturePlaced?: (placement: SignaturePlacement) => void;
}> = ({ onSignatureComplete, onSignaturePlaced }) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [placementMode, setPlacementMode] = useState(false);

  const handleSave = () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;
    
    const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    setSignatureUrl(dataUrl);
    onSignatureComplete?.(dataUrl);
    setPlacementMode(true);
  };

  const handleClear = () => {
    sigCanvasRef.current?.clear();
  };

  return (
    <Card>
      <CardTitle>Digital Signature</CardTitle>
      
      {!placementMode ? (
        <div>
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            backgroundColor="#f8f9fa"
            canvasProps={{
              width: 280,
              height: 120,
              style: { border: '2px dashed #d1d5db', borderRadius: '8px' }
            }}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={handleClear}>Clear</Button>
            <Button variant="primary" onClick={handleSave}>Save Signature</Button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}>
            Signature saved! Click on the PDF to place it.
          </p>
          <Button 
            variant="secondary" 
            onClick={() => setPlacementMode(false)}
          >
            Create New Signature
          </Button>
        </div>
      )}
    </Card>
  );
};

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('editor');
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js
  const loadPDF = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      if (canvasRef.current) {
        await renderPage(pdf, 1);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: zoom / 100 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Update annotation canvas size
    if (annotationCanvasRef.current) {
      annotationCanvasRef.current.width = canvas.width;
      annotationCanvasRef.current.height = canvas.height;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    }
  };

  const addTextBox = (x: number, y: number) => {
    const newTextBox: TextBox = {
      id: nanoid(),
      page: currentPage,
      x,
      y,
      width: 200,
      height: 30,
      text: 'New Text',
      fontSize: 16,
      color: '#000000',
      fontFamily: 'Arial'
    };
    
    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedTextBoxId(newTextBox.id);
  };

  const updateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(prev => prev.map(box => 
      box.id === id ? { ...box, ...updates } : box
    ));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);
    
    addTextBox(x, y);
  };

  const exportPDF = async () => {
    if (!pdfDocument) return;
    
    // Simple export - would need full implementation
    console.log('Exporting PDF with', textBoxes.length, 'text elements');
  };

  const tabs = [
    { key: 'editor', label: 'PDF Editor' },
    { key: 'ocr', label: 'OCR' },
    { key: 'signature', label: 'Signature' },
    { key: 'tools', label: 'Tools' }
  ];

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title>Comprehensive PDF Editor</Title>
          {fileName && (
            <span style={{ fontSize: '14px', color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: '16px' }}>
              {fileName}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            Upload PDF
          </Button>
          {pdfDocument && (
            <Button variant="secondary" onClick={exportPDF}>
              Export PDF
            </Button>
          )}
        </div>
      </Header>

      <TabContainer>
        <div style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>
      </TabContainer>

      <MainContent>
        <Sidebar>
          {activeTab === 'ocr' && (
            <OCRTool onTextExtracted={(text) => console.log('OCR text:', text)} />
          )}
          
          {activeTab === 'signature' && (
            <SignatureTool onSignatureComplete={(url) => console.log('Signature:', url)} />
          )}
          
          {activeTab === 'tools' && (
            <div>
              <Card>
                <CardTitle>Page Tools</CardTitle>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Additional tools will be available here
                </p>
              </Card>
            </div>
          )}
          
          {activeTab === 'editor' && (
            <div>
              <Card>
                <CardTitle>Text Tools</CardTitle>
                <Button variant="secondary" onClick={() => console.log('Add text')}>
                  Add Text Element
                </Button>
              </Card>
              
              <Card>
                <CardTitle>Navigation</CardTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    ←
                  </Button>
                  <span style={{ fontSize: '14px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="secondary" 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    →
                  </Button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                    -
                  </Button>
                  <span style={{ fontSize: '14px', minWidth: '60px', textAlign: 'center' }}>
                    {zoom}%
                  </span>
                  <Button variant="secondary" onClick={() => setZoom(Math.min(300, zoom + 25))}>
                    +
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </Sidebar>

        <CanvasArea>
          {!pdfDocument ? (
            <CanvasContainer>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  No PDF Loaded
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  Upload a PDF file to start editing
                </p>
                <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                  Upload PDF
                </Button>
              </div>
            </CanvasContainer>
          ) : (
            <CanvasContainer>
              <div style={{ position: 'relative' }}>
                <PDFCanvas ref={canvasRef} onClick={handleCanvasClick} />
                <AnnotationCanvas ref={annotationCanvasRef} />
                
                {/* Text boxes overlay */}
                <div style={{ position: 'absolute', top: 0, left: 0 }}>
                  {textBoxes
                    .filter(box => box.page === currentPage)
                    .map(box => (
                      <Rnd
                        key={box.id}
                        position={{ 
                          x: box.x * (zoom / 100), 
                          y: box.y * (zoom / 100) 
                        }}
                        size={{ 
                          width: box.width * (zoom / 100), 
                          height: box.height * (zoom / 100) 
                        }}
                        onDragStop={(e, data) => {
                          updateTextBox(box.id, {
                            x: data.x / (zoom / 100),
                            y: data.y / (zoom / 100)
                          });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          updateTextBox(box.id, {
                            width: parseInt(ref.style.width) / (zoom / 100),
                            height: parseInt(ref.style.height) / (zoom / 100),
                            x: position.x / (zoom / 100),
                            y: position.y / (zoom / 100)
                          });
                        }}
                      >
                        <TextElement selected={selectedTextBoxId === box.id}>
                          <textarea
                            value={box.text}
                            onChange={(e) => updateTextBox(box.id, { text: e.target.value })}
                            onFocus={() => setSelectedTextBoxId(box.id)}
                            style={{
                              fontSize: `${box.fontSize * (zoom / 100)}px`,
                              fontFamily: box.fontFamily,
                              color: box.color
                            }}
                          />
                        </TextElement>
                      </Rnd>
                    ))}
                </div>
              </div>
            </CanvasContainer>
          )}
        </CanvasArea>
      </MainContent>
      
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p>Loading PDF...</p>
          </div>
        </div>
      )}
    </Container>
  );
}