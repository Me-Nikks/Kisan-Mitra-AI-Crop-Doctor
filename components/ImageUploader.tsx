"use client";

import { useRef } from "react";

interface ImageUploaderProps {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export default function ImageUploader({
  previewUrl,
  onFileSelect,
  onRemove,
  error
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) {
      return;
    }
    onFileSelect(files[0]);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-400 bg-green-50 p-4 text-center"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Uploaded crop preview"
            className="max-h-40 rounded-lg object-contain"
          />
        ) : (
          <>
            <p className="font-semibold text-green-900">Upload crop image</p>
            <p className="text-sm text-green-700">Drag & drop or click to browse</p>
            <p className="text-xs text-green-600">JPEG, PNG, WEBP up to 5MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {previewUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Remove Image
        </button>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
