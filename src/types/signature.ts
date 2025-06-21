interface SignatureData {
  dataUrl: string;
  hash?: string;
}

interface SignatureToolProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  signatureDataUrl?: string;
  onPlace?: (placement: SignaturePlacement) => void;
}

interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page?: number;
}

interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  showCancel?: boolean;
  width?: number;
  height?: number;
}