import React, { useRef, useState, useEffect, ReactNode } from "react";
import styled from "styled-components";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import Tesseract from "tesseract.js";

// CAMERA TO PDF COMPONENT
export const CameraToPDF: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch {
      alert("Camera access denied or not supported.");
    }
  };

  const captureToPDF = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");
    const imageBytes = await fetch(imageDataUrl).then((res) => res.arrayBuffer());

    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(imageBytes);

    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(blob));
  };

  return (
    <Wrapper>
      <h2>Camera to PDF</h2>
      <Video ref={videoRef} autoPlay muted playsInline />
      <Canvas ref={canvasRef} />
      <ButtonGroup>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={captureToPDF}>Capture PDF</button>
      </ButtonGroup>
      {pdfUrl && (
        <StyledLink href={pdfUrl} target="_blank" rel="noopener noreferrer">
          View PDF
        </StyledLink>
      )}
    </Wrapper>
  );
};

// CHART TO PDF COMPONENT
export const ChartToPdf: React.FC = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const handleExportPDF = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const pngImage = await pdfDoc.embedPng(imgData);
    const { width, height } = page.getSize();
    const imgDims = pngImage.scaleToFit(width, height);

    page.drawImage(pngImage, {
      x: (width - imgDims.width) / 2,
      y: (height - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    saveAs(blob, "chart-export.pdf");
  };

  return (
    <div>
      <div
        ref={chartRef}
        style={{
          width: "100%",
          maxWidth: 600,
          height: 400,
          background: "#f5f5f5",
          border: "2px dashed #ccc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3>Your Chart or Visual Element</h3>
      </div>
      <button onClick={handleExportPDF}>
        Export Chart to PDF
      </button>
    </div>
  );
};

// IMAGE TO PDF COMPONENT
interface ImageToPdfProps {
  onGenerated?: (pdfBytes: Uint8Array) => void;
}
export const ImageToPdf: React.FC<ImageToPdfProps> = ({ onGenerated }) => {
  const handleImageToPdf = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      let image, dims;

      try {
        image = await pdfDoc.embedJpg(arrayBuffer);
        dims = image.scale(1);
      } catch {
        image = await pdfDoc.embedPng(arrayBuffer);
        dims = image.scale(1);
      }

      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height
      });

      const pdfBytes = await pdfDoc.save();
      onGenerated && onGenerated(new Uint8Array(pdfBytes));
    };

    input.click();
  };

  return (
    <button
      onClick={handleImageToPdf}
      style={{
        padding: "10px 16px",
        background: "#00b894",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      🖼️ Convert Image to PDF
    </button>
  );
};


// PDF TO IMAGES COMPONENT
interface PdfToImagesProps {
  onImagesGenerated?: (images: { blob: Blob | null; pageIndex: number }[]) => void;
}
export const PdfToImages: React.FC<PdfToImagesProps> = ({ onImagesGenerated }) => {
  const convertPdfToImages = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise as any;
      const images: { blob: Blob | null; pageIndex: number }[] = [];

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        images.push({ blob, pageIndex: i });
      }

      onImagesGenerated && onImagesGenerated(images);
    };

    input.click();
  };

  return (
    <button
      onClick={convertPdfToImages}
      style={{
        padding: "10px 16px",
        background: "#6c5ce7",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      🖼️ Convert PDF to Images
    </button>
  );
};


// PDF TO HTML FUNCTION
export async function renderPdfAsHtml(
  pdfBytes: ArrayBuffer,
  container: HTMLElement
): Promise<void> {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise as any;
  container.innerHTML = "";

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1.25 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const pageWrapper = document.createElement("div");
    pageWrapper.className = "pdf-html-page mb-4";
    pageWrapper.appendChild(canvas);
    container.appendChild(pageWrapper);
  }
}

// PDF TO TEXT FUNCTION
export async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise as any;
  const totalPages = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str).join(" ");
    fullText += strings + "\n";
  }

  return fullText.trim();
}

// ========== STYLES ==========

const Wrapper = styled.div`
  margin: 2rem 0;
  text-align: center;
`;

const Video = styled.video`
  width: 100%;
  max-width: 600px;
  border: 2px solid #ccc;
  border-radius: 10px;
`;

const Canvas = styled.canvas`
  display: none;
`;

const ButtonGroup = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StyledLink = styled.a`
  margin-top: 1rem;
  display: inline-block;
  font-weight: bold;
  color: #4f46e5;
`;

