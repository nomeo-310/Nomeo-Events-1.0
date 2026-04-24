import PublicEventsPage from "@/components/root/events/public-events/public-events-page";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Events',
}

const EventsPage = () => {
  
  return (
    <>
      <Navigation/>
        <PublicEventsPage/>
      <Footer/>
    </>
  )
}

export default EventsPage;