import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RBXPass - Активация Robux через GamePass",
  description: "Безопасная и быстрая активация Robux через GamePass в Roblox",
  keywords: ["Roblox", "Robux", "GamePass", "активация", "RBXPass"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased animated-bg">
        {children}
      </body>
    </html>
  );
}
