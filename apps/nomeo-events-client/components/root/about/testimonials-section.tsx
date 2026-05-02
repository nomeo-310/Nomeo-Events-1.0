import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';
import { SectionHeader } from './section-header';
import type { TestimonialItem } from '@/types/about-type';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
}

const TestimonialCard = ({ testimonial }: { testimonial: TestimonialItem }) => (
  <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300">
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: testimonial.rating }).map((_, i) => (
        <HugeiconsIcon key={i} icon={StarIcon} className="h-4 w-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
      &ldquo;{testimonial.quote}&rdquo;
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {testimonial.author.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{testimonial.role}</p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {testimonial.eventType}
      </Badge>
    </div>
  </div>
);

export const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => (
  <section id="testimonials" className="py-20 md:py-24 bg-gray-50/50 dark:bg-gray-900/50">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Testimonials"
        title="Loved by Event Organizers"
        description="See what our customers have to say about their experience"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} />
        ))}
      </div>
    </div>
  </section>
);