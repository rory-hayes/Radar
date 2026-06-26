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
  title: "Radar | Live guidance with approved sources",
  description:
    "Hidden-until-needed live guidance for complex technical customer conversations, backed by approved and cited sources.",
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
      </body>
    </html>
  );
}
