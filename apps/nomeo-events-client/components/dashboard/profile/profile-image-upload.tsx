"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Camera02Icon } from "@hugeicons/core-free-icons";
import { compressImage } from "@/lib/compress-image";

type UploadStage = 'compressing' | 'uploading' | null;

interface ProfileImageUploadProps {
  currentImage: string | null;
  onImageUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  label: string;
  canUpload?: boolean;
}

export const ProfileImageUpload = ({ 
  currentImage, 
  onImageUpload, 
  isUploading, 
  label, 
  canUpload = true 
}: ProfileImageUploadProps) => {
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
          maxSizeMB: 0.5,
          maxDimension: 800,
          initialQuality: 0.85,
        });
        fileToUpload = compressed;
      }

      setUploadStage('uploading');
      await onImageUpload(fileToUpload);
      
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
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

  const openFileSelector = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div 
      className="relative group"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`
          relative overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-xl
          w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36
          ${isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}
          ${canUpload ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
          transition-all
        `}
        onClick={openFileSelector}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={label}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl text-white font-bold">
              {label.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {(isUploading || uploadStage) && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-white" />
            <span className="text-[8px] sm:text-[10px] text-white text-center">{stageLabel}</span>
          </div>
        )}

        {canUpload && !isUploading && !uploadStage && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <HugeiconsIcon icon={Camera02Icon} className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        )}
      </div>

      {canUpload && !isUploading && !uploadStage && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-10">
          Square image recommended
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};