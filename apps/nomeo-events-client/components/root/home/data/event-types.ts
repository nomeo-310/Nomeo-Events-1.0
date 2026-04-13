import {
  UserGroup03Icon as UsersIcon,
  Video01Icon as VideoCameraIcon,
  RocketIcon,
  MusicNoteIcon,
  CalendarIcon,
} from "@hugeicons/core-free-icons";
import { EventType } from "../../../../types/event-type";

export const eventTypes: EventType[] = [
  { name: "Seminars",           icon: UsersIcon,       color: "bg-blue-500"   },
  { name: "Webinars",           icon: VideoCameraIcon, color: "bg-purple-500" },
  { name: "Programme Launches", icon: RocketIcon,      color: "bg-orange-500" },
  { name: "Entertainment",      icon: MusicNoteIcon,   color: "bg-pink-500"   },
  { name: "Parties",            icon: CalendarIcon,    color: "bg-green-500"  },
  { name: "Conferences",        icon: UsersIcon,       color: "bg-indigo-500" },
];