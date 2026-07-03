import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar",
  description: "Customer-facing business verification for assertion-led teams.",
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
