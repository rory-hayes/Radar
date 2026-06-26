import type { Metadata } from "next";
import localFont from "next/font/local";

import { AdminShell } from "@/components/admin/admin-shell";
import "../../globals.css";

const geistSans = localFont({
  src: "../../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Radar Knowledge Studio",
  description: "Admin control plane for Radar sources, playbooks, approvals, replay, sessions, settings, and audit.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
