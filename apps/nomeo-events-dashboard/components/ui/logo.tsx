"use client";

import Link from "next/link";
import Image from "next/image";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
      <div className="w-8 h-8">
        <Image src={'/logo.png'} priority alt="logo" className="object-contain" width={32} height={32} />
      </div>
      <span className="font-bold text-gray-900 dark:text-white tracking-tight text-[15px]">
        Nomeo <span className="text-blue-600 dark:text-blue-400">Events</span>
      </span>
    </Link>
  );
};

export default Logo;