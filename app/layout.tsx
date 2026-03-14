// FILE: app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import Toast from "@/components/ui/Toast";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "EDT Summit Management System",
  description: "Manage events, participants, expenses, and financial reports",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EDT Summit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/edt logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistrar />
        <ReduxProvider>
          <QueryProvider>
            <Toast />
            {children}
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
