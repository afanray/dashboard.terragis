import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terra GIS - Admin Dashboard",
  description: "Premium admin panel to monitor donations and platform statistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body 
        suppressHydrationWarning 
        className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 selection:bg-emerald-500/20 selection:text-emerald-800"
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
