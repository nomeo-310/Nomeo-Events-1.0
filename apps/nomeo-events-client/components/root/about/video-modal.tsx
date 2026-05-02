// components/VideoModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ArrowExpandIcon, ArrowShrinkIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export const VideoModal = ({ isOpen, onClose, videoUrl, title = "Demo Video" }: VideoModalProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFullscreen = () => {
    const modalContent = document.getElementById('video-modal-content');
    if (!modalContent) return;

    if (!isFullscreen) {
      if (modalContent.requestFullscreen) {
        modalContent.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  // Extract video ID from YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        id="video-modal-content"
        className={cn(
          "relative bg-black rounded-xl overflow-hidden transition-all duration-300",
          isFullscreen ? "fixed inset-0 rounded-none" : "w-full max-w-5xl mx-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-indigo-400 transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <HugeiconsIcon 
                icon={isFullscreen ? ArrowShrinkIcon : ArrowExpandIcon} 
                className="h-5 w-5" 
              />
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-400 transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
              aria-label="Close"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative pt-[56.25%] bg-black">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Optional: Video Info Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white/80 text-sm">
            Watch how Nomeo Events makes event management simple and effortless
          </p>
        </div>
      </div>
    </div>
  );
};