"use client";

import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleNavigation = () => {
    const isLoggedIn = !!session?.user;
    
    if (!isLoggedIn) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen">
      <div className="flex md:gap-6 items-center flex-col md:flex-row p-8 gap-14">
        {/* Animated Image Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 0.6
          }}
          className="relative overflow-hidden rounded-md md:size-72 lg:size-80 size-60 shadow-lg flex-none"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src="/images/404.jpg"
              className="rounded-md aspect-square"
              fill
              alt="404_banner"
              priority
            />
          </motion.div>
          
          <motion.div
            className="absolute inset-0 rounded-md border-2 border-primary-red"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="text-indigo-600 max-w-lg">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl lg:text-5xl leading-7 text-center md:text-left"
          >
            Page not found!
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-dark-grey text-xl leading-7 mt-5 text-center md:text-left"
          >
            The page you are looking for does not exist.
          </motion.p>

          {/* Return Home Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8"
          >
            <motion.button
              onClick={handleNavigation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-400 
                       text-white font-semibold rounded-full 
                       flex items-center justify-center gap-3
                       shadow-lg hover:shadow-xl transition-colors cursor-pointer"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              <span>Return Home</span>
            </motion.button>
          </motion.div>

          {/* Support link */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 text-center md:text-left"
          >
            <button
              onClick={() => router.push("/contact")}
              className="text-gray-600 hover:text-gray-800 
                       dark:text-gray-400 dark:hover:text-gray-200 
                       font-medium transition-colors"
            >
              Need help? Contact Support
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}