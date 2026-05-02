import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRightIcon, Message01Icon } from '@hugeicons/core-free-icons';

interface CtaSectionProps {
  onGetStarted: () => void;
  onContactSales: () => void;
}

export const CtaSection = ({ onGetStarted, onContactSales }: CtaSectionProps) => (
  <section id="cta" className="py-20 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 cursor-pointer">
        Ready to Create Your Next Event?
      </h2>
      <p className="text-indigo-100 text-lg mb-10 max-w-md mx-auto">
        Join thousands of event organizers who trust Nomeo Events to power their success.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-6 text-base" onClick={onGetStarted}>
          Start Free Trial
          <HugeiconsIcon icon={ArrowRightIcon} className="h-5 w-5 ml-2" />
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="border-white text-white hover:bg-white/10 px-8 py-6 text-base"
          onClick={onContactSales}
        >
          Contact Sales
          <HugeiconsIcon icon={Message01Icon} className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  </section>
);