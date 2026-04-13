"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon } from "@hugeicons/core-free-icons";
import { ActiveTab } from "../../../types/event-type";
import { useEventAccordion } from "../../../hooks/use-event-accordion";
import { upcomingEventsData } from "./data/upcoming-events";
import EventsHeader from "./events/events-header";
import EventCardGrid from "./events/event-card-grid";
import EventCardList from "./events/event-card-list";
import EventAccordion from "./events/event-accordion";

const EventsSection = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('webinars');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { openAccordionId, toggleAccordion } = useEventAccordion();

  const upcomingEvents = upcomingEventsData[activeTab];

  const handleTabChange = () => {
    toggleAccordion(null);
  };

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-3">
            Don't Miss Out
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upcoming{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Events
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Discover and register for events happening soon. Secure your spot today.
          </p>
        </div>

        <EventsHeader 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onTabChange={handleTabChange}
        />

        <div className="hidden sm:block mb-10">
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCardGrid key={event.id} event={event} activeTab={activeTab} router={router} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCardList key={event.id} event={event} activeTab={activeTab} router={router} />
              ))}
            </div>
          )}
        </div>

        <div className="sm:hidden space-y-3 mb-10">
          {upcomingEvents.map((event) => (
            <EventAccordion
              key={event.id}
              event={event}
              activeTab={activeTab}
              router={router}
              isOpen={openAccordionId === event.id}
              onToggle={() => toggleAccordion(event.id)}
            />
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push(`/${activeTab}`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
          >
            See More {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            <HugeiconsIcon icon={ArrowRightIcon} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;