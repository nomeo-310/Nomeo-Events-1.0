import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ModalProvider } from "@/providers/modal-provider";
import { ThemeProvider } from "next-themes";
import { ThemeWatcher } from "@/components/ui/theme-watcher";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Toaster } from "sonner";

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
    template: 'Nomeo Events | %s',
    default: 'Nomeo Events | Smart Event Management',
  },
  description: 'One platform for seminars, webinars, programme launches, concerts, and corporate events. Nomeo-Events gives you event pages, RSVPs, paid tickets, check-in, and analytics.',
  keywords: ['seminar management', 'webinar platform', 'programme launch event', 'concert ticketing', 'entertainment event planner', 'hybrid events', 'event check-in app', 'Nomeo'],
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)} suppressHydrationWarning >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" richColors />
          <ThemeWatcher/>
          <ModalProvider>
            {children}
          </ModalProvider>
          <ScrollToTop/>
        </ThemeProvider>
      </body>
    </html>
  );
}
