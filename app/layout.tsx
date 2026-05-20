import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import SidebarShell from "@/app/components/SidebarShell";
import NextAuthProvider from "@/provider/NextAuthProvider";
import TanstackProvider from "@/provider/TanstackProvider";
import { ThemeProvider } from "@/provider/theme-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mentor-AI",
  description:
    "Mentor-AI – a unified study assistant by Ali Ahmed (hackathon project)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${spaceMono.variable} ${fraunces.variable} antialiased`}
      >
        <NextAuthProvider>
          <TanstackProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <SidebarShell>{children}</SidebarShell>
            </ThemeProvider>
          </TanstackProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
