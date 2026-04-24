import HomePage from "@/components/root/home/home-page";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Home',
}

export default function Home() {
  
  return (
    <>
      <Navigation/>
      <HomePage/>
      <Footer/>
    </>
  );
}
