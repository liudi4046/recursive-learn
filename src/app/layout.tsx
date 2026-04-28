import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Recursive Learn",
  description: "Recursive learning with AI—follow up on every question until it’s clear."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-dvh bg-ml-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
