import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Providers from "@/components/layout/Providers";
import AuthGuard from "@/components/layout/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Master Dashboard | K-10 Curriculum Tracker",
  description: "Comprehensive project tracker for K-10 Math curriculum assets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <AuthGuard>
            <Sidebar />
            <main className="pl-[260px] min-h-screen">
              <div className="p-6 max-w-[1400px]">
                {children}
              </div>
            </main>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
