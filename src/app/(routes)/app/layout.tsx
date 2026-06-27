import type { Metadata } from "next";
import localFont from "next/font/local";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthSession } from "@/lib/auth/session";
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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/sign-in?next=/app");
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AdminShell authEmail={session.email}>{children}</AdminShell>
      </body>
    </html>
  );
}
