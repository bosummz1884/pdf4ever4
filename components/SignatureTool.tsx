import React, { useRef, useState, MouseEvent, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { signatureService } from "../services/signatureService";
import { SignatureData, SignatureToolProps, SignaturePlacement } from "../types/signature";

const SignaturePad: React.FC<{
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  showCancel?: boolean;
  width?: number;
  height?: number;
}> = ({
  onSave,
  onComplete,
  onSigned,
  onClose,
  showCancel = false,
  width = 400,
  height = 200,
}) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);

  const clear = useCallback(() => {
    sigCanvas.current?.clear();
  }, []);

  const handleSave = useCallback(() => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    const signatureData = signatureService.createSignatureData(dataUrl);
    
    onSave?.(dataUrl);
    onComplete?.(dataUrl);
    onSigned?.(signatureData);
    clear();
  }, [onSave, onComplete, onSigned, clear]);

  return (
    <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 bg-white max-w-full mx-auto">
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        backgroundColor="#f8f9fa"
        canvasProps={{
          width,
          height,
          className: "border rounded bg-gray-100",
        }}
      />
      <div className="mt-4 flex justify-center gap-4 flex-wrap">
        <button
          onClick={clear}
          className="px-4 py-2 font-bold border-none rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 font-bold border-none rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
        >
          Save
        </button>
        {showCancel && (
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold border-none rounded bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const SignatureDragLayer: React.FC<{
  signatureDataUrl?: string;
  onPlace?: (placement: SignaturePlacement) => void;
  currentPage?: number;
}> = ({ signatureDataUrl, onPlace, currentPage = 1 }) => {
  const [positions, setPositions] = useState<SignaturePlacement[]>([]);

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl) return;
    const bounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const newSig = signatureService.createSignaturePlacement(
      x, y, signatureDataUrl, 150, 75, currentPage
    );
    
    setPositions(prev => [...prev, newSig]);
    onPlace?.(newSig);
  }, [signatureDataUrl, onPlace, currentPage]);

  return (
    <div 
      className="relative w-full h-full border-2 border-dashed border-gray-400 bg-gray-50 min-h-48 cursor-crosshair"
      onClick={handleClick}
    >
      {positions.map((sig, i) => (
        <img
          key={i}
          src={sig.src}
          alt="Signature"
          className="absolute pointer-events-none"
          style={{
            left: sig.x,
            top: sig.y,
            width: sig.width,
            height: sig.height,
          }}
        />
      ))}
    </div>
  );
};

const SignatureTool: React.FC<SignatureToolProps> = (props) => {
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(undefined);
  const [dragMode, setDragMode] = useState<boolean>(false);

  const handleSave = useCallback((dataUrl: string) => {
    setSignatureUrl(dataUrl);
    const signatureData = signatureService.createSignatureData(dataUrl);
    
    props.onSave?.(dataUrl);
    props.onComplete?.(dataUrl);
    props.onSigned?.(signatureData);
    setDragMode(true);
  }, [props]);

  const handleDragPlaced = useCallback((placement: SignaturePlacement) => {
    props.onPlace?.(placement);
  }, [props]);

  const handleClose = useCallback(() => {
    setSignatureUrl(undefined);
    setDragMode(false);
    props.onClose?.();
  }, [props]);

  return (
    <div className="space-y-4">
      {!dragMode && (
        <SignaturePad
          onSave={handleSave}
          onComplete={props.onComplete}
          onSigned={props.onSigned}
          onClose={handleClose}
          showCancel={!!props.onClose}
          width={500}
          height={200}
        />
      )}
      {dragMode && signatureUrl && (
        <div className="space-y-4">
          <div className="font-semibold text-gray-700">
            Click anywhere on the document below to place your signature:
          </div>
          <SignatureDragLayer 
            signatureDataUrl={signatureUrl} 
            onPlace={handleDragPlaced}
          />
          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className="px-4 py-2 font-bold border-none rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureTool;