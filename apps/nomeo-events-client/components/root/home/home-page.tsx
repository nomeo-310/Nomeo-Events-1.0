"use client";

import { useModal } from "@/hooks/use-modal";
import { AuthWrapper } from "../auth/auth-wrapper";
import Hero from "./hero";
import Stats from "./stats";
import Features from "./features";
import EventsSection from "./event-section";
import HowItWorks from "./how-it-works";
import CTA from "./cta";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import UserJourneyGuide from "./user-journey-guide";


const HomePage = () => {
  const { openModal, closeModal } = useModal();

  const router = useRouter();

  const { data: session , isPending} = authClient.useSession();

  const handleOpenSignupModal = () => {
    openModal({
      title: "",
      size: "large",
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: <AuthWrapper defaultView="signup" onClose={closeModal} />,
    });
  };

  const routeToDashboard = () => {
    router.push('/dashboard')
  }

  const handleCTAClick = () => {
    
    if (isPending) return;
    if (session?.user) {
      routeToDashboard();
    } else {
      handleOpenSignupModal();
    }
  };

  const handleScrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Hero onGetStarted={handleCTAClick} onSeeHowItWorks={handleScrollToFeatures}/>
      <Stats/>
      <Features />
      <UserJourneyGuide/>
      <EventsSection />
      <HowItWorks />
      <CTA onGetStarted={handleCTAClick} />
    </>
  );
};

export default HomePage;