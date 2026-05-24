"use client";

import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors duration-200">
        <span className="text-white font-black text-sm leading-none">N</span>
      </div>
      <span className="font-bold text-gray-900 dark:text-white tracking-tight text-[15px]">
        Nomeo <span className="text-blue-600 dark:text-blue-400">Events</span>
      </span>
    </Link>
  );
};

export default Logo;