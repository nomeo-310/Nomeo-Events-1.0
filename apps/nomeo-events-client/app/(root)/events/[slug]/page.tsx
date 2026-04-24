import PublicEventPage from "@/components/root/events/public-event/public-event";
import Footer from "@/components/shared/footer/footer";
import Navigation from "@/components/shared/navigation/navigation";
import {Metadata} from "next";

export const metadata: Metadata = {
  title: 'Event Details',
}

const SingleEvent = () => {
  
  return (
    <>
      <Navigation/>
        <PublicEventPage/>
      <Footer/>
    </>
  )
}

export default SingleEvent;