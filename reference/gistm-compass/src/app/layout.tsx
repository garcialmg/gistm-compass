import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body-src",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dataFont = IBM_Plex_Mono({
  variable: "--font-data-src",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GISTM Compass",
  description:
    "Plataforma de gestão da conformidade, rastreabilidade de evidências e planos de ação para o GISTM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable} ${dataFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-mineral-50 text-mineral-900">{children}</body>
    </html>
  );
}
