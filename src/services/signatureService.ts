import { sha256 } from "js-sha256";
import { SignatureData, SignaturePlacement } from "../types/signature";

export class SignatureService {
  private static instance: SignatureService;

  static getInstance(): SignatureService {
    if (!SignatureService.instance) {
      SignatureService.instance = new SignatureService();
    }
    return SignatureService.instance;
  }

  generateSignatureHash(dataUrl: string): string {
    return sha256(dataUrl);
  }

  createSignatureData(dataUrl: string): SignatureData {
    return {
      dataUrl,
      hash: this.generateSignatureHash(dataUrl)
    };
  }

  validateSignature(signature: SignatureData): boolean {
    if (!signature.dataUrl || !signature.hash) return false;
    return this.generateSignatureHash(signature.dataUrl) === signature.hash;
  }

  createSignaturePlacement(
    x: number, 
    y: number, 
    dataUrl: string, 
    width: number = 150, 
    height: number = 75,
    page: number = 1
  ): SignaturePlacement {
    return {
      x,
      y,
      width,
      height,
      src: dataUrl,
      page
    };
  }

  resizeSignature(
    canvas: HTMLCanvasElement, 
    targetWidth: number, 
    targetHeight: number
  ): string {
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;
    
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    return resizedCanvas.toDataURL('image/png');
  }

  trimSignatureCanvas(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width;
    let maxX = 0;
    let minY = canvas.height;
    let maxY = 0;
    
    // Find bounding box of non-transparent pixels
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Create trimmed canvas
    const trimmedCanvas = document.createElement('canvas');
    const trimmedCtx = trimmedCanvas.getContext('2d');
    
    if (!trimmedCtx) throw new Error('Could not get trimmed canvas context');
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    trimmedCanvas.width = width;
    trimmedCanvas.height = height;
    
    trimmedCtx.drawImage(
      canvas,
      minX, minY, width, height,
      0, 0, width, height
    );
    
    return trimmedCanvas.toDataURL('image/png');
  }
}

export const signatureService = SignatureService.getInstance();