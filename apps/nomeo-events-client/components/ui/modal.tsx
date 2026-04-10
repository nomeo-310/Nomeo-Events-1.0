"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon as CloseIcon } from "@hugeicons/core-free-icons";
import { ModalContentProps, ModalHeaderProps } from "@/types/modal-type";
import { useModalStore } from "@/stores/modal-store";


type ModalSize = "small" | "medium" | "large" | "extra-large" | "extremely-large";

const modalSizes: Record<ModalSize, { width: string; maxHeight: string; padding: string; titleSize: string; descriptionSize: string; }> = 
{
  small: {
    width: "max-w-md",
    maxHeight: "max-h-[50vh]",
    padding: "p-3 md:p-4 lg:p-6",
    titleSize: "text-lg",
    descriptionSize: "text-sm",
  },
  medium: {
    width: "max-w-lg",
    maxHeight: "max-h-[60vh]",
    padding: "p-3 md:p-4 lg:p-6",
    titleSize: "text-xl",
    descriptionSize: "text-sm",
  },
  large: {
    width: "max-w-3xl",
    maxHeight: "max-h-[70vh]",
    padding: "p-3 md:p-4 lg:p-6",
    titleSize: "text-2xl",
    descriptionSize: "text-sm lg:text-base",
  },
  "extra-large": {
    width: "max-w-5xl",
    maxHeight: "max-h-[80vh]",
    padding: "p-3 md:p-4 lg:p-8",
    titleSize: "text-3xl",
    descriptionSize: "text-sm lg:text-base",
  },
  "extremely-large": {
    width: "max-w-7xl",
    maxHeight: "max-h-[80vh]",
    padding: "p-3 md:p-4 lg:p-8 ",
    titleSize: "text-xl lg:text-3xl",
    descriptionSize: "text-sm lg:text-base",
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: "spring" as const, 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { 
      duration: 0.2 
    }
  }
};

const scrollbarStyles = `
  .modal-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-track {
    background: #f9fafb;
    border-radius: 10px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb {
    background: #e0e7ff;
    border-radius: 10px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a5b4fc;
  }
  
  .dark .modal-scrollbar::-webkit-scrollbar-track {
    background: #111827;
  }
  
  .dark .modal-scrollbar::-webkit-scrollbar-thumb {
    background: #4338ca;
  }
  
  .dark .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4f46e5;
  }
`;


const ModalHeader = ({ title, description, icon: Icon, showCloseButton, onClose, size }: ModalHeaderProps) => {
  const sizeConfig = modalSizes[size];

  return (
    <div className={`${!description ? "mb-0" : "mb-4"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div>
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex-shrink-0">
                  <HugeiconsIcon 
                    icon={Icon} 
                    
                    className="text-indigo-600 dark:text-indigo-400 size-5 md:size-6 lg:size-7 xl:size-8"
                  />
                </div>
              )}
              <h2 className={`font-bold text-gray-900 dark:text-white ${sizeConfig.titleSize}`}>
                {title}
              </h2>
            </div>

            {description && (
              <p className={`mt-2 text-gray-600 dark:text-gray-400 ${sizeConfig.descriptionSize}`}>
                {description}
              </p>
            )}
          </div>
        </div>
        {showCloseButton && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Close modal"
          >
            <HugeiconsIcon icon={CloseIcon} className="size-5 md:size-6 lg:size-7 xl:size-8" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

const ModalContent = ({ children, size }: ModalContentProps) => {
  const sizeConfig = modalSizes[size];

  return (
    <div className={`flex-1 overflow-y-auto ${sizeConfig.padding} pt-0 modal-scrollbar`}>
      {children}
    </div>
  );
};


export const Modal = () => {
  const { state, closeModal } = useModalStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Inject scrollbar styles
    if (!document.querySelector("#modal-scrollbar-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "modal-scrollbar-styles";
      styleSheet.textContent = scrollbarStyles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    if (!state.closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isOpen) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [state.isOpen, state.closeOnEsc, closeModal]);

  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [state.isOpen]);

  if (!mounted) return null;

  const sizeConfig = modalSizes[state.size as ModalSize];

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={state.closeOnOutsideClick ? closeModal : undefined}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`
                ${sizeConfig.width}
                w-full
                ${sizeConfig.maxHeight}
                bg-white dark:bg-gray-900
                rounded-2xl
                shadow-2xl
                flex
                flex-col
                relative
                border
                border-gray-200
                dark:border-gray-800
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`${sizeConfig.padding} pb-0`}>
                <ModalHeader
                  title={state.title}
                  description={state.description}
                  icon={state.icon}
                  showCloseButton={state.showCloseButton}
                  onClose={closeModal}
                  size={state.size}
                />
              </div>

              {/* Content */}
              <ModalContent size={state.size}>
                {state.children}
              </ModalContent>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};


