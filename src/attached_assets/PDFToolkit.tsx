import React, { useState, useCallback, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
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
import { pdfCore } from "../services/pdf-Core";

interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface PDFToolkitProps {
  onFileProcessed?: (file: PDFFile) => void;
  currentFile?: PDFFile;
}

export default function PDFToolkit({
  onFileProcessed,
  currentFile,
}: PDFToolkitProps) {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("merge");
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [rotationAngle, setRotationAngle] = useState(90);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (files: FileList, isMerge = false) => {
      setIsProcessing(true);
      setProgress(0);

      const uploadedFiles: PDFFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== "application/pdf") continue;

        setProgress((i / files.length) * 50);

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

          uploadedFiles.push(pdfFile);

          if (!isMerge && i === 0) {
            onFileProcessed?.(pdfFile);
          }
        } catch (error) {
          console.error(`Failed to load PDF: ${file.name}`, error);
        }
      }

      if (isMerge) {
        setFiles((prev) => [...prev, ...uploadedFiles]);
        setMergeOrder((prev) => [...prev, ...uploadedFiles.map((f) => f.id)]);
      } else {
        setFiles(uploadedFiles);
      }

      setProgress(100);
      setIsProcessing(false);
    },
    [onFileProcessed],
  );

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
        const pages: number[] = [];
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
        const filename =
          range.name || `${currentFile.name}-part-${index + 1}.pdf`;
        pdfCore.downloadBlob(blob, filename);
      });

      setProgress(100);
    } catch (error) {
      console.error("Split failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile, splitRanges]);

  const rotatePDF = useCallback(
    async (pageNum?: number) => {
      if (!currentFile) return;

      setIsProcessing(true);

      try {
        const targetPage = pageNum || 1;
        const rotatedPdfBytes = await pdfCore.rotatePDF(
          currentFile.data,
          targetPage,
          rotationAngle,
        );

        const blob = new Blob([new Uint8Array(rotatedPdfBytes)], { type: 'application/pdf' });
        setProgress(100);
        pdfCore.downloadBlob(blob, `${currentFile.name}-rotated.pdf`);
      } catch (error) {
        console.error("Rotation failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentFile, rotationAngle],
  );

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
      const reduction = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);

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
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
            Shrink
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
                                  reorderMergeFiles(
                                    index,
                                    Math.max(0, index - 1),
                                  )
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
                                  setFiles(
                                    files.filter((f) => f.id !== fileId),
                                  );
                                  setMergeOrder(
                                    mergeOrder.filter((id) => id !== fileId),
                                  );
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
                <div className="text-center py-8 text-gray-500">
                  Upload multiple PDF files to merge them
                </div>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Split Ranges</Label>
                      <Button size="sm" onClick={addSplitRange}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Range
                      </Button>
                    </div>

                    <ScrollArea className="h-48 border rounded p-4">
                      <div className="space-y-3">
                        {splitRanges.map((range) => (
                          <div
                            key={range.id}
                            className="grid grid-cols-4 gap-2 items-center p-2 border rounded"
                          >
                            <Input
                              placeholder="Name"
                              value={range.name}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  name: e.target.value,
                                })
                              }
                            />

                            <Input
                              type="number"
                              placeholder="Start"
                              min={1}
                              max={currentFile.pageCount}
                              value={range.start}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  start: parseInt(e.target.value),
                                })
                              }
                            />

                            <Input
                              type="number"
                              placeholder="End"
                              min={1}
                              max={currentFile.pageCount}
                              value={range.end}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  end: parseInt(e.target.value),
                                })
                              }
                            />

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeSplitRange(range.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Button
                    onClick={splitPDF}
                    disabled={splitRanges.length === 0 || isProcessing}
                    className="w-full"
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    Split into {splitRanges.length} files
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Upload a PDF file to split it
                </div>
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
                  <div className="space-y-2">
                    <Label>Rotation Angle</Label>
                    <Select
                      value={rotationAngle.toString()}
                      onValueChange={(value) =>
                        setRotationAngle(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90° Clockwise</SelectItem>
                        <SelectItem value="180">180°</SelectItem>
                        <SelectItem value="270">270° Clockwise</SelectItem>
                        <SelectItem value="-90">
                          90° Counter-clockwise
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => rotatePDF()}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate All Pages {rotationAngle}°
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Upload a PDF file to rotate it
                </div>
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
                  <div className="space-y-2">
                    <Label>Compression Level</Label>
                    <Select
                      value={compressionLevel}
                      onValueChange={setCompressionLevel}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          Low (Better Quality)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (Balanced)
                        </SelectItem>
                        <SelectItem value="high">
                          High (Smaller Size)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm">
                      <strong>Current file:</strong> {currentFile.name}
                    </p>
                    <p className="text-sm">
                      <strong>Size:</strong> {formatFileSize(currentFile.size)}
                    </p>
                    <p className="text-sm">
                      <strong>Pages:</strong> {currentFile.pageCount}
                    </p>
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
                <div className="text-center py-8 text-gray-500">
                  Upload a PDF file to compress it
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Pages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Pages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Add Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent>
                {currentFile && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-500">File name:</span>
                      <span>{currentFile.name}</span>
                      <span className="text-gray-500">File size:</span>
                      <span>{formatFileSize(currentFile.size)}</span>
                      <span className="text-gray-500">Pages:</span>
                      <span>{currentFile.pageCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
