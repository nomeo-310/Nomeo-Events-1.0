"use client";

import Link from "next/link";
import { LogoProps } from "@/types/navigation-type";

const Logo = ({ onClick }: LogoProps) => {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5 flex-shrink-0 group">
      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors duration-200">
        <span className="text-white font-black text-sm leading-none">N</span>
      </div>
      <span className="font-bold text-gray-900 dark:text-white tracking-tight text-[15px] hidden sm:block">
        Nomeo <span className="text-indigo-600 dark:text-indigo-400">Events</span>
      </span>
    </Link>
  );
};

export default Logo;