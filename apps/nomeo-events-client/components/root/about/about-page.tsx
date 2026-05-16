'use client';

import { useEffect, useState } from 'react';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';
import { VideoModal } from './video-modal';
import { useModal } from '@/hooks/use-modal';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AuthWrapper } from '../auth/auth-wrapper';
import { stats, features, values, team, testimonials, integrations, howItWorksSteps, revenueStreams, serviceDeliveryPoints, faqs, faqCategories, inquiryTypes } from './about-data';
import { HeroSection } from './hero-section';
import { StatsSection } from './stats-section';
import { MissionSection } from './mission-section';
import { FeaturesSection } from './features-section';
import { HowItWorksSection } from './how-it-works-section';
import { BusinessModelSection } from './business-model-section';
import { IntegrationsSection } from './integration-section';
import { ValuesSection } from './values-section';
import { TestimonialsSection } from './testimonials-section';
import { TeamSection } from './team-section';
import { FaqSection } from './faq-section';
import { CtaSection } from './cta-section';
import { ContactSection } from './contact-section';
import { useEvents } from '@/hooks/use-events';
import { useSubscription } from '@/hooks/use-subscription';

export default function AboutPage() {
  const { scrollToSection } = useSmoothScroll();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('getting-started');
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const { useOrganizerAllEvents} = useEvents();
  const { data } = useOrganizerAllEvents();
  const eventCount = data?.eventCount;

  const { checkEventCreation } = useSubscription();
  const allowCreation = checkEventCreation(eventCount?.total);

  const handleOpenSignupModal = () => {
    openModal({
      title: '',
      size: 'large',
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: <AuthWrapper defaultView="signup" onClose={closeModal} />,
    });
  };

  const routeToDashboard = () => {
    if (allowCreation.allowed) {
      router.push('/dashboard/events/create-event');
    } else {
      router.push('/dashboard/events');
    }
  }

  const handleCTAClick = () => {
    if (isPending) return;
    if (session?.user) {
      routeToDashboard();
    } else {
      handleOpenSignupModal();
    }
  };

  const handleWatchDemo = () => {
    setIsDemoOpen(true);
  };

  const handleContactClick = (category: 'general' | 'support' | 'sales' | 'partnership' | 'feedback') => {
    setSelectedCategory(category);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  useEffect(() => {
    if (window.location.hash) {
      const sectionId = window.location.hash.slice(1);
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  }, [scrollToSection]);

  const filteredFaqs = activeFaqCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeFaqCategory);

  return (
    <>
      <HeroSection onGetStarted={handleCTAClick} onWatchDemo={handleWatchDemo} />
      <StatsSection stats={stats} />
      <MissionSection />
      <FeaturesSection features={features} />
      <HowItWorksSection steps={howItWorksSteps} />
      <BusinessModelSection revenueStreams={revenueStreams} serviceDeliveryPoints={serviceDeliveryPoints} />
      <IntegrationsSection integrations={integrations} />
      <ValuesSection values={values} />
      <TestimonialsSection testimonials={testimonials} />
      <TeamSection team={team} />
      <FaqSection 
        faqs={faqs}
        filteredFaqs={filteredFaqs}
        faqCategories={faqCategories}
        activeCategory={activeFaqCategory}
        onCategoryChange={setActiveFaqCategory}
        onContactSupport={() => handleContactClick('support')}
      />
      <CtaSection onGetStarted={handleCTAClick} onContactSales={() => handleContactClick('sales')} />
      <ContactSection 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        inquiryTypes={inquiryTypes}
      />
      <VideoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="Nomeo Events Platform Demo"
      />
    </>
  );
}