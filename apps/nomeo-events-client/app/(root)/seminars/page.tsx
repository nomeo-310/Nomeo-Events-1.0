import SeminarPage from "@/components/root/seminars/seminar-page";
import Navigation from "@/components/shared/navigation/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Seminars',
}

const Seminars = () => {
  
  return (
    <>
      <Navigation/>
      <SeminarPage/>
    </>
  )
}

export default Seminars;