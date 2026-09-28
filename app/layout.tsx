import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeThere — Presence, thoughtfully arranged",
  description:
    "Arrange a thoughtful representative for birthdays, weddings, and moments of remembrance in Singapore. Personal gestures, transparent pricing.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
