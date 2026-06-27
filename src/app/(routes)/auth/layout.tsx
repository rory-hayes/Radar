export const metadata = {
  title: "Sign In | Radar",
  description:
    "Sign in to Radar to configure Knowledge Studio, approved sources, and live guidance.",
};

import "../../globals.css";
import localFont from "next/font/local";
import Navigation from "@/sections/navigation";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}
      >
        <div className="min-h-screen">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
