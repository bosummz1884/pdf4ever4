import React, { useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Upload,
  Download,
  Split,
  Merge,
  RotateCw,
  FileText,
  Trash2,
  Plus,
  Copy,
  Save,
  FileDown,
  Scissors,
  Combine,
  RefreshCw,
  Shrink,
  Shield,
  Eye,
  Settings,
} from "lucide-react";
import { PDFFile, SplitRange, PDFToolkitProps, InvoiceData } from "@/types/pdf-types";
import { pdfCore } from "@/services/pdf-core";

export default function PDFToolkit({
  onFileProcessed,
  currentFile,
  files: initialFiles = []
}: PDFToolkitProps) {
  const [files, setFiles] = useState<PDFFile[]>(initialFiles);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("merge");
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [rotationAngle, setRotationAngle] = useState(90);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    date: new Date().toISOString().split('T')[0],
    from: { name: "", address: [""] },
    to: { name: "", address: [""] },
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    total: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = useCallback(async (uploadedFiles: FileList, isMerge = false) => {
    setIsProcessing(true);
    setProgress(0);

    const newFiles: PDFFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== "application/pdf") continue;

      setProgress((i / uploadedFiles.length) * 50);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfCore.loadPDF(arrayBuffer);

        const pdfFile: PDFFile = {
          id: `pdf-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          data: arrayBuffer,
          pageCount: pdfDoc.numPages,
        };

        newFiles.push(pdfFile);

        if (!isMerge && i === 0) {
          onFileProcessed?.(pdfFile);
        }
      } catch (error) {
        console.error(`Failed to load PDF: ${file.name}`, error);
      }
    }

    if (isMerge) {
      setFiles((prev) => [...prev, ...newFiles]);
      setMergeOrder((prev) => [...prev, ...newFiles.map((f) => f.id)]);
    } else {
      setFiles(newFiles);
    }

    setProgress(100);
    setIsProcessing(false);
  }, [onFileProcessed]);

  // PDF Operations
  const mergePDFs = useCallback(async () => {
    if (mergeOrder.length < 2) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const orderedFiles = mergeOrder
        .map((id) => files.find((f) => f.id === id))
        .filter(Boolean) as PDFFile[];

      const pdfDataArray = orderedFiles.map((f) => f.data);
      setProgress(50);

      const mergedPdfBytes = await pdfCore.mergePDFs(pdfDataArray);
      setProgress(90);

      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
      pdfCore.downloadBlob(blob, "merged-document.pdf");

      setProgress(100);
    } catch (error) {
      console.error("Merge failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, mergeOrder]);

  const splitPDF = useCallback(async () => {
    if (!currentFile || splitRanges.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const pageRanges = splitRanges.map((range) => {
        const pages = [];
        for (let i = range.start; i <= range.end; i++) {
          pages.push(i);
        }
        return pages;
      });

      setProgress(30);
      const splitPdfs = await pdfCore.splitPDF(currentFile.data, pageRanges);
      setProgress(80);

      splitPdfs.forEach((pdfBytes, index) => {
        const range = splitRanges[index];
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const filename = range.name || `${currentFile.name}-part-${index + 1}.pdf`;
        pdfCore.downloadBlob(blob, filename);
      });

      setProgress(100);
    } catch (error) {
      console.error("Split failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile, splitRanges]);

  const rotatePDF = useCallback(async (pageNum?: number) => {
    if (!currentFile) return;

    setIsProcessing(true);

    try {
      const targetPage = pageNum || 1;
      const rotatedPdfBytes = await pdfCore.rotatePDF(
        currentFile.data,
        targetPage,
        rotationAngle,
      );

      const blob = new Blob([new Uint8Array(rotatdPdfBytes)], { type: "application/pdf" });
      setProgress(100);
      pdfCore.downloadBlob(blob, `${currentFile.name}-rotated.pdf`);
    } catch (error) {
      console.error("Rotation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile, rotationAngle]);

  const compressPDF = useCallback(async () => {
    if (!currentFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(50);
      const compressedPdfBytes = await pdfCore.compressPDF(currentFile.data);
      setProgress(90);

      const originalSize = currentFile.size;
      const compressedSize = compressedPdfBytes.length;
      const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);

      const blob = new Blob([new Uint8Array(compressedPdfBytes)], { type: "application/pdf" });
      pdfCore.downloadBlob(blob, `${currentFile.name}-compressed.pdf`);

      alert(`Compression complete! Size reduced by ${reduction}%`);
      setProgress(100);
    } catch (error) {
      console.error("Compression failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile]);

  // Helper functions
  const addSplitRange = () => {
    const newRange: SplitRange = {
      id: `range-${Date.now()}`,
      start: 1,
      end: currentFile?.pageCount || 1,
      name: `Part ${splitRanges.length + 1}`,
    };
    setSplitRanges([...splitRanges, newRange]);
  };

  const updateSplitRange = (id: string, updates: Partial<SplitRange>) => {
    setSplitRanges((ranges) =>
      ranges.map((range) =>
        range.id === id ? { ...range, ...updates } : range,
      ),
    );
  };

  const removeSplitRange = (id: string) => {
    setSplitRanges((ranges) => ranges.filter((range) => range.id !== id));
  };

  const reorderMergeFiles = (fromIndex: number, toIndex: number) => {
    const newOrder = [...mergeOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setMergeOrder(newOrder);
  };

  const formatFileSize = (bytes: number) => {
    return pdfCore.formatFileSize(bytes);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Toolkit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>

            <Button
              onClick={() => mergeInputRef.current?.click()}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add for Merge
            </Button>

            {currentFile && (
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="secondary">
                  {currentFile.name} ({currentFile.pageCount} pages)
                </Badge>
                <Badge variant="outline">
                  {formatFileSize(currentFile.size)}
                </Badge>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />

          <input
            ref={mergeInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files, true)
            }
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center mt-2">
              Processing... {progress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* PDF Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="merge">
            <Merge className="h-4 w-4 mr-1" />
            Merge
          </TabsTrigger>
          <TabsTrigger value="split">
            <Split className="h-4 w-4 mr-1" />
            Split
          </TabsTrigger>
          <TabsTrigger value="rotate">
            <RotateCw className="h-4 w-4 mr-1" />
            Rotate
          </TabsTrigger>
          <TabsTrigger value="compress">
            <Shrink className="h-4 w-4 mr-1" />
            Compress
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Settings className="h-4 w-4 mr-1" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Merge Tab */}
        <TabsContent value="merge">
          <Card>
            <CardHeader>
              <CardTitle>Merge PDFs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.length > 0 ? (
                <>
                  <ScrollArea className="h-48 border rounded p-4">
                    <div className="space-y-2">
                      {mergeOrder.map((fileId, index) => {
                        const file = files.find((f) => f.id === fileId);
                        if (!file) return null;

                        return (
                          <div
                            key={fileId}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="text-sm">{file.name}</span>
                              <Badge variant="secondary">
                                {file.pageCount} pages
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  reorderMergeFiles(index, Math.max(0, index - 1))
                                }
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  reorderMergeFiles(
                                    index,
                                    Math.min(mergeOrder.length - 1, index + 1),
                                  )
                                }
                                disabled={index === mergeOrder.length - 1}
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setFiles(prev => prev.filter(f => f.id !== fileId));
                                  setMergeOrder(prev => prev.filter(id => id !== fileId));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <Button
                    onClick={mergePDFs}
                    disabled={mergeOrder.length < 2 || isProcessing}
                    className="w-full"
                  >
                    <Combine className="h-4 w-4 mr-2" />
                    Merge {mergeOrder.length} PDFs
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Upload PDFs to merge them together
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Split Tab */}
        <TabsContent value="split">
          <Card>
            <CardHeader>
              <CardTitle>Split PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentFile ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>
                      Current file: <strong>{currentFile.name}</strong> ({currentFile.pageCount} pages)
                    </span>
                    <Button onClick={addSplitRange} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Range
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {splitRanges.map((range) => (
                      <div key={range.id} className="flex items-center gap-2 p-2 border rounded">
                        <Input
                          placeholder="Range name"
                          value={range.name}
                          onChange={(e) => updateSplitRange(range.id, { name: e.target.value })}
                          className="flex-1"
                        />
                        <Label>From:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={currentFile.pageCount}
                          value={range.start}
                          onChange={(e) => updateSplitRange(range.id, { start: parseInt(e.target.value) })}
                          className="w-20"
                        />
                        <Label>To:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={currentFile.pageCount}
                          value={range.end}
                          onChange={(e) => updateSplitRange(range.id, { end: parseInt(e.target.value) })}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeSplitRange(range.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {splitRanges.length > 0 && (
                    <Button
                      onClick={splitPDF}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      Split into {splitRanges.length} files
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Upload a PDF to split it into multiple files
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rotate Tab */}
        <TabsContent value="rotate">
          <Card>
            <CardHeader>
              <CardTitle>Rotate PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentFile ? (
                <>
                  <div className="flex items-center gap-4">
                    <Label>Rotation angle:</Label>
                    <Select 
                      value={rotationAngle.toString()} 
                      onValueChange={(value) => setRotationAngle(parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90°</SelectItem>
                        <SelectItem value="180">180°</SelectItem>
                        <SelectItem value="270">270°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => rotatePDF()}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate PDF {rotationAngle}°
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Upload a PDF to rotate its pages
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compress Tab */}
        <TabsContent value="compress">
          <Card>
            <CardHeader>
              <CardTitle>Compress PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentFile ? (
                <>
                  <div className="text-sm text-gray-600">
                    <p>Current file size: <strong>{formatFileSize(currentFile.size)}</strong></p>
                    <p>Compression will optimize the PDF to reduce file size.</p>
                  </div>

                  <Button
                    onClick={compressPDF}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <Shrink className="h-4 w-4 mr-2" />
                    Compress PDF
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Upload a PDF to compress it
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Additional Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Extract Text
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  Add Password
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  Remove Password
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileDown className="h-6 w-6 mb-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
