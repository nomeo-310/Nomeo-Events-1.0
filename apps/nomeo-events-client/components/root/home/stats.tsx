"use client";

import { stats } from "./data/stats";


const Stats = () => {
  return (
    <section id="stats" className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {stat.number}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;