import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileButton } from "@/components/ProfileButton";
import { LocalStorageProvider } from "@/components/LocalStorageProvider";
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OHFdesk",
  description: "OHF does Zendesk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <LocalStorageProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <ProfileButton />
                <Toaster />
                {children}
              </div>
            </TooltipProvider>
          </LocalStorageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
