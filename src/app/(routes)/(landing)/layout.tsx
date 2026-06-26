import Navigation from "@/sections/navigation";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../globals.css";
import Footer from "@/sections/footer";
import Cta from "@/sections/cta";

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
  title: "Prodexa | Think, plan, and track all in one place",
  description:
    "All in one platform to manage your tasks and bosst your productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}
      >
        <Navigation />
        <div className="min-h-screen">{children}</div>
        <Cta />
        <Footer />
        <div className="fixed bottom-0 left-0 right-0 z-[9999] w-full border-t border-white/10 bg-gradient-to-r from-black via-zinc-900 to-black backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 text-center sm:flex-row sm:justify-between sm:gap-6 sm:px-6 sm:py-4 sm:text-left">
            <div className="flex flex-col items-center gap-0.5 sm:items-start">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400 sm:text-xs">
                Prodexa Template
              </span>
              <span className="text-sm font-semibold text-white sm:text-base">
                Like what you see? Get the full source.
              </span>
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
              <a
                href="https://www.shadcn.io/dashboard/template"
                className="flex-1 rounded-full border border-white/30 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 sm:flex-none sm:px-6 sm:text-base"
              >
                Download
              </a>
              <a
                href="https://www.shadcn.io/pricing"
                className="flex-1 rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-black shadow-md transition hover:bg-blue-400 hover:text-white sm:flex-none sm:px-6 sm:text-base"
              >
                Get PRO →
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
