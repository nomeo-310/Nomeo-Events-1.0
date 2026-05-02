import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, TelephoneIcon as PhoneIcon, Location01Icon, ArrowRightIcon } from '@hugeicons/core-free-icons';
import type { InquiryType } from '@/types/about-type'

interface ContactSectionProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  inquiryTypes: InquiryType[];
}

export const ContactSection = ({ selectedCategory, onCategoryChange, inquiryTypes }: ContactSectionProps) => (
  <section id="contact" className="py-20 md:py-24 border-t border-gray-100 dark:border-gray-800">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <Badge variant="secondary" className="mb-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 tracking-wide font-bold">
            Get in Touch
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Have Questions? We&apos;re Here to Help
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Whether you&apos;re curious about features, pricing, or need technical support — our team is ready to answer all your questions.
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={Mail01Icon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Email Us</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">support@nomeoevents.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={PhoneIcon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Call Us</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">+2347037575894</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Mon-Fri, 9am-6pm WAT</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={Location01Icon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Visit Us</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">Lagos, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <form className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <Input type="text" placeholder="John Doe" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <Input type="email" placeholder="hello@example.com" className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <Input type="tel" placeholder="+234 123 456 7890" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Inquiry Type *
              </label>
              <Select value={selectedCategory} onValueChange={(value) => onCategoryChange(value || 'general')}>
                <SelectTrigger className="w-full h-10 lg:h-11">
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  {inquiryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <Textarea rows={5} placeholder="Tell us more about your inquiry..." className="w-full resize-none h-20 lg:h-28" />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base rounded-full py-3 h-12">
              Send Message
              <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  </section>
);