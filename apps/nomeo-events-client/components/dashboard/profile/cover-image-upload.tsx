"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Camera02Icon } from "@hugeicons/core-free-icons";
import { compressImage } from "@/lib/compress-image";

type UploadStage = 'compressing' | 'uploading' | null;

interface CoverImageUploadProps {
  currentImage: string | null;
  onImageUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  canUpload?: boolean;
}

export const CoverImageUpload = ({ 
  currentImage, 
  onImageUpload, 
  isUploading, 
  canUpload = true 
}: CoverImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload JPG, PNG, WebP, or SVG");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size: 10MB");
      return false;
    }
    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    try {
      let fileToUpload = file;

      if (file.type !== 'image/svg+xml') {
        setUploadStage('compressing');
        const { file: compressed } = await compressImage(file, {
          maxSizeMB: 1,
          maxDimension: 1920,
          initialQuality: 0.85,
        });
        fileToUpload = compressed;
      }

      setUploadStage('uploading');
      await onImageUpload(fileToUpload);
      
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Error uploading cover:', error);
      setLocalPreview(null);
      throw error;
    } finally {
      setUploadStage(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileSelect(file);
    e.target.value = '';
  };

  const openFileSelector = () => {
    if (canUpload && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!canUpload || isUploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const displayImage = localPreview || currentImage;
  const stageLabel = uploadStage === 'compressing' ? 'Compressing...' : 'Uploading...';

  return (
    <div className="relative">
      <div 
        className="relative h-48 sm:h-56 md:h-80 w-full overflow-hidden group rounded-b-lg md:rounded-lg"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {displayImage && (
          <Image
            src={displayImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
        {!displayImage && (
          <div className="absolute inset-0 bg-indigo-600" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        {canUpload && (
          <>
            <button
              onClick={openFileSelector}
              className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 hover:bg-black/80 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg cursor-pointer transition backdrop-blur-sm z-10 text-xs sm:text-sm ${
                isDragging ? 'ring-2 ring-indigo-500 bg-indigo-600 bg-opacity-80' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 sm:w-4 sm:h-4 animate-spin inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{stageLabel}</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Camera02Icon} className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Change Cover</span>
                  <span className="sm:hidden">Cover</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </>
        )}
      </div>
      
      {!currentImage && canUpload && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Recommended: 1500x500px (3:1 ratio)
        </div>
      )}
    </div>
  );
};