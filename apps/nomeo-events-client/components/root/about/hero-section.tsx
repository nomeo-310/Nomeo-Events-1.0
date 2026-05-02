import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRightIcon, PlayIcon } from '@hugeicons/core-free-icons';

interface HeroSectionProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

export const HeroSection = ({ onGetStarted, onWatchDemo }: HeroSectionProps) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-white dark:from-indigo-950/20 dark:via-gray-950 dark:to-gray-950">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 dark:bg-indigo-700 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full blur-3xl" />
    </div>

    <div className="container mx-auto px-4 py-20 md:py-28 relative">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
          Empowering Event Organizers
          <span className="text-indigo-600 dark:text-indigo-400"> Since 2020</span>
        </h1>
        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          We&apos;re on a mission to revolutionize event management in Africa and beyond, 
          making it effortless to create, manage, and scale successful events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-base" onClick={onGetStarted}>
            Start Your Journey
            <HugeiconsIcon icon={ArrowRightIcon} className="h-5 w-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-base dark:border-gray-700 dark:text-gray-300" onClick={onWatchDemo}>
            <HugeiconsIcon icon={PlayIcon} className="h-5 w-5 mr-2" />
            Watch Demo
          </Button>
        </div>
      </div>
    </div>
  </section>
);