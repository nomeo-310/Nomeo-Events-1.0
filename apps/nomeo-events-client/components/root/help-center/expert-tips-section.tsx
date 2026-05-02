import { HugeiconsIcon } from '@hugeicons/react';
import { IdeaIcon as LightbulbIcon, FavouriteIcon as HeartIcon, UserIcon } from '@hugeicons/core-free-icons';
import type { ExpertTip } from '@/types/help-center-type';
import { SectionHeader } from './section-header';

interface ExpertTipsSectionProps {
  tips: ExpertTip[];
}


export const ExpertTipsSection = ({ tips }: ExpertTipsSectionProps) => (
  <section id="expert-tips" className="py-20">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Expert Tips"
        title="Pro Tips & Best Practices"
        description="Proven strategies from industry experts to help you succeed"
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <HugeiconsIcon icon={LightbulbIcon} className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{tip.author}</p>
                    <p className="text-sm text-gray-500">{tip.role}</p>
                  </div>
                  <button className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                    <HugeiconsIcon icon={HeartIcon} className="h-4 w-4" />
                    <span className="text-xs">{tip.likes}</span>
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  &ldquo;{tip.tip}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);