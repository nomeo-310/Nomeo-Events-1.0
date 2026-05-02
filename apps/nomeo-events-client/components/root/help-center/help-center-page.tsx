'use client';

import { useEffect, useState } from 'react';

import { popularTopics, expertTips, faqs, ticketCategories, communityGroups, guidesAndVideos } from './help-center-data';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';
import { HeroSection } from './hero-section';
import { PopularTopicsSection } from './popular-topics-section';
import { CommunitySection } from './community-section';
import { ExpertTipsSection } from './expert-tips-section';
import { TicketSystemSection } from './ticket-system-section';
import { GuidesSection } from './guide-section';
import { FaqGridSection } from './faq-grid-section';

export default function HelpCenterPage() {
  const { scrollToSection } = useSmoothScroll();
  const [searchQuery, setSearchQuery] = useState('');
  
    useEffect(() => {
    if (window.location.hash) {
      const sectionId = window.location.hash.slice(1);
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  }, [scrollToSection]);

  const filteredGuides = searchQuery ? guidesAndVideos.filter(item =>  item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())) : guidesAndVideos;


  return (
    <>
    <>
      <HeroSection />
      <PopularTopicsSection topics={popularTopics} />
      <GuidesSection items={filteredGuides} />
      <CommunitySection groups={communityGroups} />
      <ExpertTipsSection tips={expertTips} />
      <FaqGridSection faqs={faqs} />
      <TicketSystemSection categories={ticketCategories} />
    </>
    </>
  );
}