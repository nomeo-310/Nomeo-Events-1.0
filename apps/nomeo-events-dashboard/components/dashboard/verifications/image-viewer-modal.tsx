// ImageViewerModal.tsx - Create this as a separate component
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as CloseIcon,
  ArrowLeft01Icon as PreviousIcon,
  ArrowRight01Icon as NextIcon,
  ZoomInAreaIcon as ZoomInIcon,
  ZoomOutAreaIcon as ZoomOutIcon,
  Maximize01Icon as FullscreenIcon,
  Minimize01Icon as MinimizeIcon,
  Download02Icon as DownloadIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageViewerModalProps {
  images: Array<{
    url: string;
    alt: string;
    label?: string;
  }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  currentIndex: externalIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(externalIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // Fix: Initialize with undefined instead of no argument
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Sync with external index
  useEffect(() => {
    setCurrentIndex(externalIndex);
    resetView();
  }, [externalIndex]);

  // Handle auto-hide controls
  useEffect(() => {
    if (!isOpen) return;
    
    const hideControls = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) setShowControls(false);
      }, 2000);
    };
    
    hideControls();
    
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) setShowControls(false);
      }, 2000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isOpen, isDragging]);

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resetView = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    resetView();
    onNavigate?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    resetView();
    onNavigate?.(newIndex);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    resetView();
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    const currentImage = images[currentIndex];
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = currentImage.alt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Add boundaries
      const maxX = (imageRef.current?.clientWidth || 0) * (zoomLevel - 1) / 2;
      const maxY = (imageRef.current?.clientHeight || 0) * (zoomLevel - 1) / 2;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(distance);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance) {
      const newDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = newDistance - touchDistance;
      if (Math.abs(delta) > 10) {
        setZoomLevel(prev => {
          const newZoom = prev + (delta > 0 ? 0.1 : -0.1);
          return Math.min(Math.max(newZoom, 0.5), 3);
        });
        setTouchDistance(newDistance);
      }
    } else if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      const maxX = (imageRef.current?.clientWidth || 0) * (zoomLevel - 1) / 2;
      const maxY = (imageRef.current?.clientHeight || 0) * (zoomLevel - 1) / 2;
      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(null);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoomLevel]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  const showZoomControls = zoomLevel !== 1;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating Controls */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-lg rounded-full px-4 py-2 transition-all duration-300 z-10",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {hasMultiple && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
            >
              <HugeiconsIcon icon={PreviousIcon} className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm font-medium px-2">
              {currentIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
            >
              <HugeiconsIcon icon={NextIcon} className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-1" />
          </>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0 disabled:opacity-50"
        >
          <HugeiconsIcon icon={ZoomOutIcon} className="h-5 w-5" />
        </Button>
        
        <button
          onClick={handleResetZoom}
          className="text-white text-xs font-mono bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 transition-colors"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0 disabled:opacity-50"
        >
          <HugeiconsIcon icon={ZoomInIcon} className="h-5 w-5" />
        </Button>
        
        <div className="w-px h-6 bg-white/20 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
        >
          <HugeiconsIcon icon={DownloadIcon} className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
        >
          <HugeiconsIcon icon={isFullscreen ? MinimizeIcon : FullscreenIcon} className="h-5 w-5" />
        </Button>
      </div>

      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        className={cn(
          "fixed top-6 right-6 bg-black/80 backdrop-blur-lg rounded-full p-2.5 transition-all duration-300 z-10 hover:bg-black/90",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <HugeiconsIcon icon={CloseIcon} className="h-5 w-5 text-white" />
      </button>

      {/* Image Counter - Top Left */}
      {hasMultiple && (
        <div
          className={cn(
            "fixed top-6 left-6 bg-black/80 backdrop-blur-lg rounded-full px-4 py-2 transition-all duration-300 z-10",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-white text-sm font-medium">
            {currentImage.label || `${currentIndex + 1} of ${images.length}`}
          </span>
        </div>
      )}

      {/* Main Image Container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={currentImage.url}
          alt={currentImage.alt}
          className="transition-transform duration-200 select-none pointer-events-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
            maxWidth: zoomLevel === 1 ? '90%' : 'none',
            maxHeight: zoomLevel === 1 ? '90%' : 'none',
            width: zoomLevel > 1 ? 'auto' : 'auto',
            height: zoomLevel > 1 ? 'auto' : 'auto',
            cursor: zoomLevel > 1 ? 'grab' : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* Help Text */}
      <div
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all duration-300 whitespace-nowrap",
          showControls && zoomLevel === 1 ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="hidden sm:inline">← → to navigate • </span>
        <span className="hidden sm:inline">+ / - to zoom • </span>
        ESC to close
      </div>
    </div>,
    document.body
  );
};