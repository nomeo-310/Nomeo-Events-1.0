import { type Notification } from "@/hooks/use-notification";

interface SenderAvatarProps {
  notification: Notification;
}

export function SenderAvatar({ notification }: SenderAvatarProps) {
  const { senderId, sender_type } = notification;
  
  // System notification
  if (sender_type === "system") {
    return (
      <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm md:text-xs font-bold">NE</span>
      </div>
    );
  }
  
  // Admin notification
  if (sender_type === "admin") {
    return (
      <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm md:text-xs font-bold">AD</span>
      </div>
    );
  }
  
  // User notification
  const userName = senderId?.name || "User";
  const userAvatar = senderId?.avatar;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  if (userAvatar) {
    return (
      <img
        src={userAvatar}
        alt={userName}
        className="w-10 h-10 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  
  return (
    <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm md:text-xs font-bold">{initials || "US"}</span>
    </div>
  );
}