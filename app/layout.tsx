import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisan Mitra — AI Crop Doctor",
  description: "AI-powered crop disease diagnosis for farmers"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-green-100 text-gray-900">{children}</body>
    </html>
  );
}
