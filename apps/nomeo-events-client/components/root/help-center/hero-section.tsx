import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { HeadphonesIcon, Message01Icon, BookOpenIcon } from '@hugeicons/core-free-icons';

export const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
    </div>
    
    <div className="container mx-auto px-4 py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto text-center">
        <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-3">
          <HugeiconsIcon icon={HeadphonesIcon} className="h-4 w-4 mr-2" />
          24/7 Support Available
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
          How Can We Help You?
        </h1>
        <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
          Everything you need to master the Nomeo Events platform — from getting started guides to advanced API documentation
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <HugeiconsIcon icon={BookOpenIcon} className="h-4 w-4 text-white" />
            <span className="text-sm text-white">200+ Articles</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <HugeiconsIcon icon={Message01Icon} className="h-4 w-4 text-white" />
            <span className="text-sm text-white">10k+ Community Members</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <HugeiconsIcon icon={HeadphonesIcon} className="h-4 w-4 text-white" />
            <span className="text-sm text-white">Avg Response: 2min</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);