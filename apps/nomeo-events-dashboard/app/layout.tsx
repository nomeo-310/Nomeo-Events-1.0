import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "sonner";
import { ThemeWatcher } from "@/components/ui/theme-watcher";
import { Onboarding } from "@/components/onboarding/onboarding";
import { getCurrentUser } from "@/lib/session";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    template: 'Nomeo Dashboard | %s',
    default: 'Nomeo Dashboard | Notifications',
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const loggedInUser = await getCurrentUser();

  const onboardingProps = {
    needsOnboarding: loggedInUser ? !loggedInUser.isOnboarded : false,
    userData: loggedInUser ? {
      email: loggedInUser.email,
      name: loggedInUser.name,
      displayName: loggedInUser.displayName,
    } : null,
  };

  return (
    <html lang="en" className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)} suppressHydrationWarning >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <Toaster position="top-center" richColors />
            <ThemeWatcher/>
            {children}
            <Onboarding 
              needsOnboarding={onboardingProps.needsOnboarding}
              userData={onboardingProps.userData}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
