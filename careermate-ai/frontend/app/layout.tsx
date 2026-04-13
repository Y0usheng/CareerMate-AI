import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerMate AI",
  description: "CareerMate AI landing page and register flow built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
