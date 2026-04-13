"use client";

import { useState } from "react";
import { NewsletterSectionProps } from "@/types/footer-type";

const NewsletterSection = ({ onSubscribe }: NewsletterSectionProps) => {
  const [email, setEmail] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubscribe && email) {
      onSubscribe(email);
      setEmail("");
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left lg:w-1/2 w-full">
          <h4 className="text-white font-semibold mb-1">Stay Updated</h4>
          <p className="text-sm text-gray-400">Get the latest event news and updates</p>
        </div>
        <form onSubmit={handleSubmit} className="flex lg:w-1/2 w-full gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSection;