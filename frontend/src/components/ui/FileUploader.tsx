"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle } from "lucide-react";
import { useState } from "react";

interface FileUploaderProps {
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  sublabel?: string;
  allowDirectory?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function FileUploader({
  accept = { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
  multiple = true,
  maxFiles = 50,
  label = "Tarik & lepas file di sini, atau klik untuk memilih",
  sublabel = "Mendukung format .xlsx, .xls, .csv, atau file gambar",
  allowDirectory = false,
  onFilesSelected,
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    multiple,
    maxFiles,
    maxSize: 4 * 1024 * 1024, // 4MB
    onDrop: (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
      onFilesSelected(acceptedFiles);
    },
  });

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input 
          {...getInputProps()} 
          {...(allowDirectory ? { webkitdirectory: 'true' } as any : {})}
        />
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-primary">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          <strong>Perhatian:</strong> {fileRejections.length} file ditolak karena ukurannya melebihi batas 4MB. 
          Vercel membatasi upload maksimal 4.5MB. Harap perkecil file tersebut atau hapus dari folder Anda.
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
            <span>Berkas Terpilih ({selectedFiles.length})</span>
            <button
              onClick={() => {
                setSelectedFiles([]);
                onFilesSelected([]);
              }}
              className="text-red-500 hover:underline"
            >
              Hapus Semua
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate mr-2">
                  <File className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">({formatSize(file.size)})</span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
