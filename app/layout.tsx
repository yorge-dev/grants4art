import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Exo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const exo = Exo({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-exo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Texas Art Grants - Funding for Designers & Artists",
  description: "Discover grant opportunities for designers and artists across Texas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${exo.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
