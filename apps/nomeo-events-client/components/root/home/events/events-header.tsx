"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Video01Icon as VideoCameraIcon,
  UserGroup03Icon as UsersIcon,
  MusicNoteIcon,
  GridViewIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";
import { ActiveTab, EventsHeaderProps } from "../../../../types/event-type";

const EventsHeader = ({ activeTab, setActiveTab, viewMode, setViewMode, onTabChange }: EventsHeaderProps) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: any }> = [
    { id: 'webinars', label: 'Webinars', icon: VideoCameraIcon },
    { id: 'seminars', label: 'Seminars', icon: UsersIcon },
    { id: 'entertainment', label: 'Entertainment', icon: MusicNoteIcon },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <HugeiconsIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md transition-colors duration-200 ${
            viewMode === 'grid'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label="Grid view"
        >
          <HugeiconsIcon icon={GridViewIcon} size={18} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-md transition-colors duration-200 ${
            viewMode === 'list'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label="List view"
        >
          <HugeiconsIcon icon={ListViewIcon} size={18} />
        </button>
      </div>
    </div>
  );
};

export default EventsHeader;