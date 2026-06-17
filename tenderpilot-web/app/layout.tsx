import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenderpilot — South African Government Tender Intelligence",
  description:
    "Tenderpilot monitors 100+ South African procurement portals daily, matches opportunities to your CIDB business profile, and generates your first-draft bid document automatically.",
  keywords: "South Africa tenders, CIDB, government procurement, eTenders, Eastern Cape tenders, bid drafting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-brand-off-white"><Providers>{children}</Providers></body>
    </html>
  );
}
