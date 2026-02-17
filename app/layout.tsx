import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Find Bottomless Mimosas",
  description: "Find bottomless mimosas and brunch drink specials near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
