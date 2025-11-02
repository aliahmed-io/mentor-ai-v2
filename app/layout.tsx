import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/provider/NextAuthProvider";
import TanstackProvider from "@/provider/TanstackProvider";
import { ThemeProvider } from "@/provider/theme-provider";
import SidebarShell from "@/app/components/SidebarShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mentor-AI",
  description: "Mentor-AI – a unified study assistant by Ali Ahmed (hackathon project)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <TanstackProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <SidebarShell>
                {children} 
              </SidebarShell>
            </ThemeProvider>
          </TanstackProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
