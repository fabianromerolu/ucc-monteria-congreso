import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "react-hot-toast";
import Footer from "../components/landing/Footer";
import WhatsAppFloating from "../components/ui/WhatsAppFloating";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UCC Montería",
  description: "Inscripciones",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-dvh flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>

        <WhatsAppFloating />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
