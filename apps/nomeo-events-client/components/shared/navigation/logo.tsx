"use client";

import Link from "next/link";
import { LogoProps } from "@/types/navigation-type";
import Image from "next/image";

const Logo = ({ onClick }: LogoProps) => {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5 flex-shrink-0 group">
      <div className="w-8 h-8">
        <Image src={'/images/logo.png'} priority alt="logo" className="object-contain" width={32} height={32} />
      </div>
      <span className="font-bold text-gray-900 dark:text-white tracking-tight text-[15px]">
        Nomeo <span className="text-indigo-600 dark:text-indigo-400">Events</span>
      </span>
    </Link>
  );
};

export default Logo;