import HelpCenterPage from "@/components/root/help-center/help-center-page";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Help Center',
}

const HelpCenter = () => {
  
  return (
    <>
      <Navigation/>
        <HelpCenterPage/>
      <Footer/>
    </>
  )
}

export default HelpCenter;