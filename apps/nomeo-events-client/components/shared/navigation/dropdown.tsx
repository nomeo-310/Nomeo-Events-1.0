"use client";

import { DropdownProps } from "@/types/navigation-type";

const Dropdown = ({ isOpen, onClose, width, children }: DropdownProps) => {
  if (!isOpen) return null;
  
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`absolute top-full right-0 mt-4 ${width} z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xl shadow-black/[0.08] dark:shadow-black/40 overflow-hidden`}
      >
        {children}
      </div>
    </>
  );
};

export default Dropdown;