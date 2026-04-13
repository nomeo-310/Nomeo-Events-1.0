"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { features } from "./data/features";

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Amazing Events
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features to help you plan, promote, and execute successful events.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 group cursor-pointer"
            >
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors duration-200">
                <HugeiconsIcon
                  icon={feature.icon}
                  size={22}
                  className="text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-200"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;