"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Message01Icon, ChampionIcon as TrophyIcon, ArrowRightIcon } from '@hugeicons/core-free-icons';
import type { CommunityGroup } from '@/types/help-center-type';
import { cn } from '@/lib/utils';

interface CommunitySectionProps {
  groups: CommunityGroup[];
}

export const CommunitySection = ({ groups }: CommunitySectionProps) => (
  <section id="community" className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Badge variant="secondary" className="mb-4 py-3 px-4">Join Our Community</Badge>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect with 10,000+ Event Professionals
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Share experiences, get advice, and grow together with fellow event organizers from around the world.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <HugeiconsIcon icon={Message01Icon} className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">5k+</p>
                <p className="text-xs text-gray-500">Discussions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <HugeiconsIcon icon={TrophyIcon} className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">200+</p>
                <p className="text-xs text-gray-500">Solutions Shared</p>
              </div>
            </div>
          </div>
          
          {/* WhatsApp and Telegram Groups */}
          <div className="space-y-3 mb-8">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Join our official groups:</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {groups.map((group) => (
                <a
                  key={group.platform}
                  href={group.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all duration-300 group"
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', group.color)}>
                    <HugeiconsIcon icon={group.icon} className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members} members</p>
                  </div>
                  <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </a>
              ))}
            </div>
          </div>
          
          <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 lg:h-11 px-6">
            Join the Community
            <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="relative">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 tracking-wider flex items-center justify-center font-semibold text-white">
                SC
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Sarah Chen</p>
                <p className="text-sm text-gray-500">Event Organizer · Top Contributor</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              &ldquo;The Nomeo community has been invaluable for my growth as an event organizer. Got answers to all my questions within hours!&rdquo;
            </p>
            <div className="flex gap-2">
              <Badge className='py-3 px-4'>Virtual Events</Badge>
              <Badge className='py-3 px-4'>Best Practices</Badge>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full -z-10" />
        </div>
      </div>
    </div>
  </section>
);