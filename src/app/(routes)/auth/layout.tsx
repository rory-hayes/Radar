export const metadata = {
  title: "Sign In | Prodexa",
  description:
    "Login to the prodexa dashboard and start managing your tasks and boost productivity",
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
        <div className=" h-screen">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
