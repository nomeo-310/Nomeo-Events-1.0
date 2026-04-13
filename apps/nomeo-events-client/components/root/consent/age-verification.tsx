"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  IdentityCardIcon as IdCardIcon,
  CalendarIcon,
  UserCheck01Icon,
  Shield01Icon,
  DrinkIcon as AlcoholIcon,
} from "@hugeicons/core-free-icons";
import { ConsentModalProps } from "@/types/consent-type";


export const AgeVerificationModal = ({isOpen, onClose, onAccept, onDecline, title = "Age Verification Required" }: ConsentModalProps) => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleVerifyAge = () => {
    if (!selectedYear || !selectedMonth || !selectedDay) {
      setError("Please select your full date of birth");
      return;
    }

    const birthDate = new Date(
      parseInt(selectedYear),
      parseInt(selectedMonth) - 1,
      parseInt(selectedDay)
    );
    
    const age = calculateAge(birthDate);
    
    // Check for 18+ events (can be configured per event)
    const minimumAge = 18;
    
    if (age >= minimumAge) {
      setError("");
      onAccept();
    } else {
      setError(`You must be at least ${minimumAge} years old to access this content/event.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white/20 rounded-full">
              <HugeiconsIcon icon={IdCardIcon} size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-indigo-100 mt-2">Please verify your age to continue</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HugeiconsIcon icon={AlcoholIcon} size={20} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Age Restricted Content</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              This event/content is intended for adults aged 18 and over. Please verify your age to access.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                <HugeiconsIcon icon={Shield01Icon} size={14} className="mt-0.5 flex-shrink-0" />
                <span>We take age verification seriously. Providing false information violates our terms of service and may result in account suspension.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <HugeiconsIcon icon={UserCheck01Icon} size={16} />
              <span>Your age will be verified once</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onDecline && (
              <button
                onClick={onDecline}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                I'm Under 18
              </button>
            )}
            <button
              onClick={handleVerifyAge}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <HugeiconsIcon icon={CalendarIcon} size={18} />
              <span>Verify Age</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};