export interface SignatureData {
  dataUrl: string;
  hash?: string;
}

export interface SignatureToolProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  signatureDataUrl?: string;
  onPlace?: (placement: SignaturePlacement) => void;
}

export interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page?: number;
}

export interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  showCancel?: boolean;
  width?: number;
  height?: number;
}
