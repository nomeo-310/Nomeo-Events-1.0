'use client';

import { useState, useEffect } from "react";
import { useSubscribeNewsletter, useNewsletterStatus } from "@/hooks/use-newsletter";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CheckmarkCircle02Icon, 
  Cancel01Icon, 
  Loading03Icon,
  Mail01Icon,
  UserIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface NewsletterSectionProps {
  className?: string;
  variant?: 'simple' | 'detailed';
}

const NewsletterSection = ({ className, variant = 'detailed' }: NewsletterSectionProps) => {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const { data: session } = authClient.useSession();
  const subscribeMutation = useSubscribeNewsletter();
  const { data: status, refetch: refetchStatus } = useNewsletterStatus(email || userEmail || null);
  
  // Check if user is logged in and set their info
  useEffect(() => {
    if (session?.user?.email) {
      setIsLoggedIn(true);
      setUserEmail(session.user.email);
      setEmail(session.user.email);
      if (session.user.name) {
        setUserName(session.user.name);
        setName(session.user.name);
      }
    } else {
      setIsLoggedIn(false);
      setUserEmail("");
      setUserName("");
    }
  }, [session]);
  
  const isSubscribed = status?.isSubscribed;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }
    
    subscribeMutation.mutate({
      email,
      name: name || undefined,
    }, {
      onSuccess: () => {
        setShowSuccess(true);
        if (!isLoggedIn) {
          setEmail("");
          setName("");
        }
        refetchStatus();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    });
  };
  
  // If user is logged in and already subscribed, show subscribed status
  if (isLoggedIn && isSubscribed) {
    return (
      <div className={cn("mt-12 pt-8 border-t border-gray-800", className)}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left flex-1">
            <h4 className="text-white font-semibold mb-1 text-lg">Stay Updated</h4>
            <p className="text-sm text-gray-400">Get the latest event news and updates</p>
          </div>
          <div className="w-fit">
            <div className="flex items-center justify-center md:justify-end gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Subscribed to newsletter
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Simple variant (only email)
  if (variant === 'simple') {
    return (
      <div className={cn("mt-12 pt-8 border-t border-gray-800", className)}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left lg:w-1/2 w-full">
            <h4 className="text-white font-semibold mb-1">Stay Updated</h4>
            <p className="text-sm text-gray-400">Get the latest event news and updates</p>
          </div>
          
          <form onSubmit={handleSubmit} className="lg:w-1/2 w-full">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HugeiconsIcon icon={Mail01Icon} size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLoggedIn ? "Your account email" : "Enter your email"}
                  className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  disabled={subscribeMutation.isPending}
                  readOnly={isLoggedIn}
                />
              </div>
              
              <button
                type="submit"
                disabled={subscribeMutation.isPending || isSubscribed}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {subscribeMutation.isPending ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                    <span>Subscribed!</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            </div>
            
            {subscribeMutation.isError && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
                {subscribeMutation.error?.response?.data?.message || 'Failed to subscribe'}
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }
  
  // Detailed variant (name + email)
  return (
    <div className={cn("mt-12 pt-8 border-t border-gray-800", className)}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h4 className="text-white font-semibold text-xl mb-2">Stay Updated</h4>
          <p className="text-gray-400">
            Subscribe to our newsletter for exclusive updates, event announcements, and special offers.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon icon={UserIcon} size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isLoggedIn ? "Your name" : "Your name"}
                className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={subscribeMutation.isPending || isLoggedIn}
                readOnly={isLoggedIn}
                required={!isLoggedIn}
              />
            </div>
            
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon icon={Mail01Icon} size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isLoggedIn ? "Your account email" : "Your email address"}
                className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                required
                disabled={subscribeMutation.isPending}
                readOnly={isLoggedIn}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={subscribeMutation.isPending || isSubscribed}
            className={cn("w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2")}
          >
            {subscribeMutation.isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : showSuccess ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                <span>Successfully Subscribed!</span>
              </>
            ) : (
              <span>Subscribe to Newsletter</span>
            )}
          </button>
          
          {/* Success/Error messages */}
          {subscribeMutation.isError && !showSuccess && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500 flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                {subscribeMutation.error?.response?.data?.message || 'Failed to subscribe. Please try again.'}
              </p>
            </div>
          )}
          
          {!isLoggedIn && (
            <p className="text-center text-xs text-gray-500">
              We respect your privacy. No spam, unsubscribe anytime.
            </p>
          )}
          
          {isLoggedIn && !isSubscribed && (
            <p className="text-center text-xs text-gray-500">
              Subscribe with your account to receive personalized updates and exclusive offers.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewsletterSection;