import {
  TicketIcon,
  UserGroup03Icon as UsersIcon,
  SendToMobile02Icon as DeviceMessageIcon,
  ClockIcon,
  StarIcon,
  SecurityCheckIcon as ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { Feature } from "../../../../types/event-type";

export const features: Feature[] = [
  { title: "Smart RSVP & Ticketing",    description: "Free RSVP, paid tickets, early-bird discounts, and promo codes — all automated.",        icon: TicketIcon        },
  { title: "Guest Management",          description: "Import CSV, sync contacts, segment guests, and send bulk emails effortlessly.",            icon: UsersIcon         },
  { title: "Check-in App",              description: "Scan QR codes or search names for instant check-in with live attendee count.",             icon: DeviceMessageIcon },
  { title: "Reminders & Notifications", description: "Automatic email/SMS reminders 24 h before event. Reduce no-shows by up to 40%.",          icon: ClockIcon         },
  { title: "Post-Event Analytics",      description: "See attendance rate, revenue, popular ticket types, and feedback scores.",                  icon: StarIcon          },
  { title: "Secure & Reliable",         description: "Enterprise-grade security with 99.9% uptime guarantee.",                                   icon: ShieldCheckIcon   },
];