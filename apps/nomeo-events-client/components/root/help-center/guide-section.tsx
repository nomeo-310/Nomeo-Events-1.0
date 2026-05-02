'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { ClockIcon, UserMultiple02Icon as UsersIcon, EyeIcon, PlayIcon, VideoIcon, File01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import type { GuideOrVideo, GuideItem, VideoTutorial } from '@/types/help-center-type';
import { VideoModal } from '../about/video-modal';

interface GuidesSectionProps {
  items: GuideOrVideo[];
}

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const GuidesSection = ({ items }: GuidesSectionProps) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleVideoClick = (video: VideoTutorial) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  // Separate guides and videos for section display
  const guides = items.filter(item => item.type === 'guide') as GuideItem[];
  const videos = items.filter(item => item.type === 'video') as VideoTutorial[];

  return (
    <>
      <section id="guides" className="py-20">
        <div className="container mx-auto px-4">
          <SectionHeader 
            badge="Guides & Tutorials"
            title="Learn at Your Own Pace"
            description="Step-by-step written guides and video tutorials to help you master every feature"
          />

          {/* Written Guides Section */}
          {guides.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Written Guides
                </h3>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <Badge variant="secondary" className="text-xs">
                  {guides.length} articles
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <HugeiconsIcon icon={guide.icon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {guide.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                        <span>{guide.readTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <HugeiconsIcon icon={UsersIcon} className="h-3 w-3" />
                        <span>{guide.popularity}% helpful</span>
                      </div>
                      <Badge className={cn('text-xs', difficultyColors[guide.difficulty])}>
                        {guide.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Tutorials Section - SAME CARD SIZE AS GUIDES */}
          {videos.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <HugeiconsIcon icon={VideoIcon} className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Video Tutorials
                </h3>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <Badge variant="secondary" className="text-xs">
                  {videos.length} videos
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleVideoClick(video)}
                    className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                  >
                    {/* Video indicator badge - top right corner */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-purple-500/90 hover:bg-purple-600 text-white border-0 gap-1">
                        <HugeiconsIcon icon={PlayIcon} className="h-2.5 w-2.5" />
                        Video
                      </Badge>
                    </div>

                    {/* Icon with play button overlay */}
                    <div className="relative w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <HugeiconsIcon icon={VideoIcon} className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      {/* Small play button overlay on icon */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                        <HugeiconsIcon icon={PlayIcon} className="h-2.5 w-2.5 text-white ml-0.5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-16">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {video.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <HugeiconsIcon icon={EyeIcon} className="h-3 w-3" />
                        <span>{video.views.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                        <span>{video.duration}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30">
                        Watch Now
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedVideo?.videoUrl || ''}
        title={selectedVideo?.title || ''}
      />
    </>
  );
};