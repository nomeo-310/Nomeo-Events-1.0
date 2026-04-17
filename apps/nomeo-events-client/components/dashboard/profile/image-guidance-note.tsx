"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Camera02Icon } from "@hugeicons/core-free-icons";

export const ImageGuidanceNote = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 relative">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-2">
        <HugeiconsIcon icon={Camera02Icon} className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Image Guidelines:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>Profile Picture:</strong> Square shape recommended (e.g., 500x500px) - will be cropped to circle</li>
            <li><strong>Cover Picture:</strong> Rectangular shape recommended (e.g., 1500x500px) - 3:1 aspect ratio works best</li>
            <li>Supported formats: JPG, PNG, WebP, SVG</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};