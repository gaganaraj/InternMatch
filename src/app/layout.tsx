
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InternMatch | Find Your Perfect Internship",
  description:
    "Discover internships matched to your skills, projects, and career goals.",
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
