"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TicketIcon,
  Calendar02Icon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon,
  SmartPhoneIcon,
  EyeIcon,
  UserAddIcon,
} from "@hugeicons/core-free-icons";

interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  detailedDescription: string;
}

const attendeeSteps: JourneyStep[] = [
  {
    id: 1,
    title: "Discover Events",
    description: "Browse through our curated collection of seminars, webinars, and entertainment events",
    icon: Calendar02Icon,
    color: "bg-indigo-600",
    detailedDescription: "Explore events by category, date, or popularity. Each event page has complete details about what to expect, who's speaking, and what you'll learn. Filter events to find exactly what interests you."
  },
  {
    id: 2,
    title: "Choose Your Event",
    description: "Select the event that matches your interests and schedule",
    icon: EyeIcon,
    color: "bg-indigo-600",
    detailedDescription: "Review event details including date, time, speaker information, agenda, and pricing. Check if it's online or in-person. Make sure it fits your calendar and learning goals."
  },
  {
    id: 3,
    title: "Register Instantly",
    description: "Fill in your details - no account needed!",
    icon: UserAddIcon,
    color: "bg-indigo-600",
    detailedDescription: "Simply provide your name and email address to register. That's it! No account creation required. You'll receive an instant confirmation email with all event details and access instructions."
  },
  {
    id: 4,
    title: "Attend & Enjoy",
    description: "Access your event and have an amazing experience",
    icon: CheckCircleIcon,
    color: "bg-indigo-600",
    detailedDescription: "For webinars: Click the joining link in your confirmation email. For in-person events: Show your QR code at check-in. Add to calendar for reminders! Your ticket is always in your email."
  }
];

const quickFacts = [
  { icon: SmartPhoneIcon, text: "Register from any device" },
  { icon: ClockIcon, text: "Registration takes < 30 seconds" },
  { icon: CreditCardIcon, text: "Secure payment gateway" },
];

const UserJourneyGuide = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Matching How It Works style */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-3">
            For Event Attendees
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Journey to{" "}
            <span className="bg-indigo-600 bg-clip-text text-transparent">
              Amazing Events
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Discover, register, and attend events in 4 simple steps — no account needed!
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {attendeeSteps.map((step) => (
              <div key={step.id} className="relative group">
                {/* Step Card */}
                <div 
                  className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  {/* Step Number Badge */}
                  <div className="inline-flex mb-4">
                    <div className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold shadow-lg`}>
                      {step.id}
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <HugeiconsIcon icon={step.icon} size={28} className="text-white" />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Expand/Collapse Indicator */}
                  <div className="mt-4 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    <span>{expandedStep === step.id ? "Show less" : "Learn more"}</span>
                    <HugeiconsIcon icon={ArrowRightIcon} className={`w-3 h-3 transition-transform duration-200 ${expandedStep === step.id ? "rotate-90" : ""}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStep === step.id && (
                  <div className="absolute z-10 mt-2 left-0 right-0 bg-indigo-50 dark:bg-indigo-950/95 rounded-xl p-4 shadow-lg border border-indigo-100 dark:border-indigo-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {step.detailedDescription}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Facts Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={CheckCircleIcon} size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Quick Registration Facts</h3>
                <p className="text-indigo-100 text-sm">Everything you need to know before getting started</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {quickFacts.map((fact, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <HugeiconsIcon icon={fact.icon} size={16} className="text-white" />
                  <span className="text-white text-sm">{fact.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Important Note for Attendees */}
        <div className="text-center">
          <div className="inline-block bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6 py-3">
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">
              ✨ <span className="font-semibold">No account needed!</span> Simply provide your name and email to register. 
              Your tickets will be sent directly to your inbox.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserJourneyGuide;