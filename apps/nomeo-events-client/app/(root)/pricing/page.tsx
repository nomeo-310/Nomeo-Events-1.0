import { PricingPage } from "@/components/root/pricing/pricing-page";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Pricing',
}

const Pricing = () => {
  
  return (
    <>
      <Navigation />
      <PricingPage/>
      <Footer/>
    </>
  )
}

export default Pricing;