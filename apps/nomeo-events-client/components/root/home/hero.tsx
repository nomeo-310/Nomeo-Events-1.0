"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon } from "@hugeicons/core-free-icons";
import { EventType, HeroProps } from "../../../types/event-type";
import { eventTypes } from "./data/event-types";

const Hero = ({ onGetStarted, onSeeHowItWorks }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950" />
      <div aria-hidden className="pointer-events-none absolute -top-52 -right-52 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-52 -left-52 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-8">
          <span aria-hidden className="block w-2 h-2 bg-indigo-500 rounded-full" />
          The All-in-One Event Platform
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Where Moments
          <span className="bg-indigo-600 bg-clip-text text-transparent">
            {" "}Meet Magic
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
          From intimate gatherings to large-scale conferences — Nomeo-Events gives you
          the tools to bring people together seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg shadow-md hover:opacity-90 transition-opacity duration-200"
          >
            Get Started Free
            <HugeiconsIcon icon={ArrowRightIcon} size={20} />
          </button>

          <button
            onClick={onSeeHowItWorks}
            className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors duration-200"
          >
            See How It Works
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Trusted by 300+ event hosts nationwide for unforgettable experiences.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {eventTypes.map((type: EventType, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 pl-2 py-2 pr-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className={`w-6 h-6 ${type.color} rounded-full flex items-center justify-center`}>
                <HugeiconsIcon icon={type.icon} size={16} className="text-white" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;