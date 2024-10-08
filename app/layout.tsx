import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import  AlertProvider from './alert';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "File Upload | bhumitrohilla.in",
  description: "Free file upload service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full`}
      >
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
