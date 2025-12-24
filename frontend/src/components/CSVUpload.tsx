import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRun, UploadedFile as RunContextUploadedFile } from "@/context/RunContext"; // Import from RunContext

interface CSVUploadProps {
  acceptedFiles?: string[];
  maxSize?: number; // in bytes
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TF"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const CSVUpload: React.FC<CSVUploadProps> = ({
  acceptedFiles = [".csv"],
  maxSize = 200 * 1024 * 1024, // 200MB default
}) => {
  const {
    uploadedFiles,
    addUploadedFile,
    updateUploadedFile,
    removeUploadedFile,
    mockTemplates,
    setCurrentStep,
    setSelectedFileIdForMapping,
    setSelectedTemplateIdForMapping,
    resetRun, // Use resetRun from context
  } = useRun();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Reset run state when component mounts if it's a new run flow
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      resetRun();
    }
  }, []); // Only run once on mount

  const handleFileChange = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" is too large. Max size is ${formatBytes(maxSize)}.`);
      return;
    }
    if (!acceptedFiles.includes(`.${file.name.split(".").pop()?.toLowerCase()}`)) {
      toast.error(`File "${file.name}" has an invalid type. Only ${acceptedFiles.join(", ")} are allowed.`);
      return;
    }

    const newFile: RunContextUploadedFile = {
      id: Math.random().toString(36).substring(2, 15), // Simple unique ID
      file,
      progress: 0,
      status: "pending",
    };
    addUploadedFile(newFile); // Add to context

    // Simulate upload progress
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + 10, 90); // Progress up to 90%
      updateUploadedFile(newFile.id, { progress: currentProgress, status: "uploading" });
    }, 200);

    try {
      // Mock backend upload response
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      const response = await new Promise<{ id: string; rowCount: number; message?: string; status: "success" | "error" }>((resolve) => {
        setTimeout(() => {
          if (isSuccess) {
            resolve({
              id: newFile.id,
              rowCount: Math.floor(Math.random() * 1000) + 100, // Simulate 100-1100 rows
              status: "success",
              message: "File processed successfully (mocked)",
            });
          } else {
            resolve({
              id: newFile.id,
              rowCount: 0,
              status: "error",
              message: "Simulated upload failure or UTF-8 encoding issue.",
            });
          }
        }, 1500); // Simulate network delay
      });

      clearInterval(progressInterval);
      updateUploadedFile(newFile.id, {
        progress: 100,
        status: response.status,
        rowCount: response.rowCount,
        message: response.message,
      });
      if (response.status === "success") {
        toast.success(`File "${file.name}" uploaded successfully.`);
      } else {
        toast.error(`Failed to upload "${file.name}": ${response.message || "Unknown error"}`);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      updateUploadedFile(newFile.id, {
        progress: 100,
        status: "error",
        message: error.message || "Upload failed",
      });
      toast.error(`Failed to upload "${file.name}": ${error.message || "Network error"}`);
    }
  }, [addUploadedFile, updateUploadedFile, acceptedFiles, maxSize]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((err: any) => {
          if (err.code === "file-too-large") {
            toast.error(`File "${file.name}" is too large. Max size is ${formatBytes(maxSize)}.`);
          } else if (err.code === "file-invalid-type") {
            toast.error(`File "${file.name}" has an invalid type. Only ${acceptedFiles.join(", ")} are allowed.`);
          } else {
            toast.error(`File "${file.name}" error: ${err.message}`);
          }
        });
      });
      acceptedFiles.forEach(handleFileChange);
    },
    [handleFileChange, acceptedFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize,
    multiple: true,
  });

  const handleDeleteFile = (id: string) => {
    removeUploadedFile(id);
    toast.info("File removed.");
  };

  const handleTemplateChange = (fileId: string, templateId: string) => {
    updateUploadedFile(fileId, { selectedTemplateId: templateId });
  };

  const handleNextStep = () => {
    const allFilesUploaded = uploadedFiles.every(f => f.status === "success");
    const allTemplatesSelected = uploadedFiles.every(f => f.selectedTemplateId);

    if (!allFilesUploaded) {
      toast.error("Please wait for all files to finish uploading or resolve errors.");
      return;
    }
    if (!allTemplatesSelected) {
      toast.error("Please select a template for all uploaded files.");
      return;
    }

    // For simplicity, we'll just pick the first uploaded file to map for now
    // In a multi-file scenario, the mapping component would need to handle switching between files
    if (uploadedFiles.length > 0) {
      setSelectedFileIdForMapping(uploadedFiles[0].id);
      setSelectedTemplateIdForMapping(uploadedFiles[0].selectedTemplateId || null);
    }

    setCurrentStep(1); // Move to Map step
    navigate("/map");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Upload Multiomic Data</CardTitle>
          <p className="text-muted-foreground">Drag and drop your CSV files here, or click to browse.</p>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {isDragActive ? "Drop the files here..." : "Drag 'n' drop some files here, or click to select files"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Only {acceptedFiles.join(", ")} files, max {formatBytes(maxSize)} each.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation(); // Prevent dropzone from triggering twice
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md bg-card shadow-sm"
              >
                <div className="flex items-center flex-1 mb-2 sm:mb-0">
                  {file.status === "success" && <CheckCircle className="h-5 w-5 text-green-500 mr-3" />}
                  {file.status === "error" && <XCircle className="h-5 w-5 text-red-500 mr-3" />}
                  {(file.status === "pending" || file.status === "uploading") && (
                    <Loader2 className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
                  )}
                  <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{file.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(file.file.size)}
                      {file.rowCount !== undefined && ` | ${file.rowCount} rows`}
                      {file.message && ` | ${file.message}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Select
                    onValueChange={(value) => handleTemplateChange(file.id, value)}
                    value={file.selectedTemplateId}
                    disabled={file.status === "uploading"}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={file.status === "uploading"}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
                {(file.status === "pending" || file.status === "uploading") && (
                  <div className="w-full mt-2 sm:mt-0">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleNextStep}>
              Next: Map Columns
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CSVUpload;