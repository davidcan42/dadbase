import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import TopHeader from "@/components/TopHeader";
import BottomNavigation from "@/components/BottomNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DadBase - Your Command Center for Fatherhood",
  description: "AI-powered support platform for fathers, backed by scientific research from Dr. Anna Machin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {/* Mobile-First Layout */}
            <div className="flex flex-col min-h-screen">
              {/* Top Header - Desktop/Tablet */}
              <div className="hidden md:block">
                <TopHeader />
              </div>
              
              {/* Main Content Area */}
              <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                <div className="max-w-6xl mx-auto">
                  {children}
                </div>
              </main>

              {/* Bottom Navigation - Mobile/Tablet */}
              <BottomNavigation />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
