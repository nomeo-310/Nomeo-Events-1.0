"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon } from "@hugeicons/core-free-icons";

interface CTAProps {
  onGetStarted: () => void;
}

const CTA = ({ onGetStarted }: CTAProps) => {
  return (
    <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Create Your First Event?
        </h2>
        <p className="text-xl text-indigo-100 mb-10">
          Join thousands of event organizers who trust Nomeo-Events.
        </p>

        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200"
        >
          Start Free — No Card Required
          <HugeiconsIcon icon={ArrowRightIcon} size={20} />
        </button>

        <p className="text-sm text-indigo-200 mt-5">
          Free plan includes up to 50 guests. Upgrade anytime.
        </p>
      </div>
    </section>
  );
};

export default CTA;