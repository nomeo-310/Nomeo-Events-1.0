"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  UserGroup03Icon as UsersIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
} from "@hugeicons/core-free-icons";

const steps = [
  {
    number: "01",
    step: "Step 1",
    title: "Create",
    description: "Fill in your event details — name, date, location, and capacity. Choose between a free or paid ticket model.",
    icon: CalendarIcon,
    gradient: "from-indigo-500 to-indigo-700",
    shadowColor: "indigo",
    isHighlighted: false,
  },
  {
    number: "02",
    step: "Step 2",
    title: "Share",
    description: "Get a unique Nomeo event link instantly. Share it via email, WhatsApp, Instagram, or any social platform.",
    icon: UsersIcon,
    gradient: "from-indigo-600 to-purple-700",
    shadowColor: "indigo",
    isHighlighted: true,
  },
  {
    number: "03",
    step: "Step 3",
    title: "Manage",
    description: "Track registrations in real time, send updates to guests, and check people in — from your phone or laptop.",
    icon: CheckCircleIcon,
    gradient: "from-purple-500 to-purple-700",
    shadowColor: "purple",
    isHighlighted: false,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-50 dark:bg-indigo-950/40 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create Events in{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Get your event up and running in minutes — no technical skills needed.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-14 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 dark:from-indigo-700 dark:via-purple-700 dark:to-indigo-700" />
            <div className="absolute left-1/4 -top-1 w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-600" />
            <div className="absolute left-3/4 -top-1 w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={index} className={`group relative ${step.isHighlighted ? 'lg:mt-8' : ''}`}>
                <div className={`relative ${
                  step.isHighlighted 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 h-full shadow-2xl shadow-indigo-200 dark:shadow-indigo-950/60'
                    : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 h-full hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-indigo-950/50'
                } transition-all duration-300`}>
                  <span className={`absolute top-5 right-6 text-7xl font-black select-none leading-none ${
                    step.isHighlighted 
                      ? 'text-white/10' 
                      : 'text-gray-200 dark:text-gray-800 group-hover:text-indigo-100 dark:group-hover:text-indigo-950'
                  } transition-colors duration-300`}>
                    {step.number}
                  </span>
                  <div className="relative z-10 mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${
                      step.isHighlighted
                        ? 'bg-white/20 backdrop-blur-sm'
                        : `bg-gradient-to-br ${step.gradient}`
                    } flex items-center justify-center shadow-lg shadow-${step.shadowColor}-200 dark:shadow-${step.shadowColor}-900/50`}>
                      <HugeiconsIcon icon={step.icon} size={26} className="text-white" />
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${
                    step.isHighlighted
                      ? 'bg-white/20 text-white'
                      : `bg-${step.shadowColor}-100 dark:bg-${step.shadowColor}-900/50 text-${step.shadowColor}-600 dark:text-${step.shadowColor}-400`
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      step.isHighlighted ? 'bg-white' : `bg-${step.shadowColor}-500`
                    }`} />
                    {step.step}
                  </span>
                  <h3 className={`text-xl font-bold mb-3 ${
                    step.isHighlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    step.isHighlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;