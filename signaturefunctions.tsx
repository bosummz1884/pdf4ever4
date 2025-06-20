import React, { useRef, useState, MouseEvent } from "react";
import SignatureCanvas from "react-signature-canvas";
import styled from "styled-components";
import { sha256 } from "js-sha256";

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
}

const CanvasWrapper = styled.div`
  border: 2px dashed #999;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  max-width: 100%;
  margin: 0 auto;
`;

const ButtonBar = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  background-color: #4f46e5;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #4338ca;
  }
`;

const DragLayerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px dashed #bbb;
  background: #fafafa;
  min-height: 200px;
`;

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

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    if (onSave) onSave(dataUrl);
    if (onComplete) onComplete(dataUrl);
    if (onSigned) onSigned({ dataUrl, hash: sha256(dataUrl) });
    clear();
  };

  return (
    <CanvasWrapper>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        backgroundColor="#f8f9fa"
        canvasProps={{
          width,
          height,
          className: "sigCanvas border rounded bg-gray-100",
        }}
      />
      <ButtonBar>
        <StyledButton onClick={clear}>Clear</StyledButton>
        <StyledButton onClick={handleSave}>Save</StyledButton>
        {showCancel && <StyledButton onClick={onClose}>Cancel</StyledButton>}
      </ButtonBar>
    </CanvasWrapper>
  );
};

const SignatureDragLayer: React.FC<{
  signatureDataUrl?: string;
  onPlace?: (placement: SignaturePlacement) => void;
}> = ({ signatureDataUrl, onPlace }) => {
  const [positions, setPositions] = useState<SignaturePlacement[]>([]);

  const handleDrop = (e: MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl) return;
    const bounds = (e.target as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const newSig: SignaturePlacement = {
      x,
      y,
      width: 150,
      height: 75,
      src: signatureDataUrl,
    };
    setPositions((prev) => [...prev, newSig]);
    if (onPlace) onPlace(newSig);
  };

  return (
    <DragLayerWrapper onClick={handleDrop}>
      {positions.map((sig, i) => (
        <img
          key={i}
          src={sig.src}
          alt="Signature"
          style={{
            position: "absolute",
            left: sig.x,
            top: sig.y,
            width: sig.width,
            height: sig.height,
            pointerEvents: "none",
          }}
        />
      ))}
    </DragLayerWrapper>
  );
};

const SignatureTool: React.FC<SignatureToolProps> = (props) => {
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(undefined);
  const [dragMode, setDragMode] = useState<boolean>(false);

  const handleSave = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    if (props.onSave) props.onSave(dataUrl);
    if (props.onComplete) props.onComplete(dataUrl);
    if (props.onSigned) props.onSigned({ dataUrl, hash: sha256(dataUrl) });
    setDragMode(true);
  };

  const handleDragPlaced = (placement: SignaturePlacement) => {
    if (props.onPlace) props.onPlace(placement);
    // You can add more side effects here if needed
  };

  // Optionally expose reset/clear for parent
  const handleClose = () => {
    setSignatureUrl(undefined);
    setDragMode(false);
    if (props.onClose) props.onClose();
  };

  return (
    <div>
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
        <>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Click anywhere on the document below to place your signature:</strong>
          </div>
          <SignatureDragLayer signatureDataUrl={signatureUrl} onPlace={handleDragPlaced} />
          <div style={{ marginTop: "1rem" }}>
            <StyledButton onClick={handleClose}>Done</StyledButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SignatureTool;
