import AboutPage from "@/components/root/about/about-page";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'About',
}

const About = () => {
  
  return (
    <>
      <Navigation/>
        <AboutPage/>
      <Footer/>
    </>
  )
}

export default About;