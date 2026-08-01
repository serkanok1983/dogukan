import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Doğukan'ın Yeri",
    template: "%s | Doğukan'ın Yeri",
  },
  description:
    "İlkokula hazırlanan meraklı çocuklar için Türkçe temel bilimler ansiklopedisi, sesli keşifler, mini deneyler, okuma, matematik ve oyunlar.",
  keywords: [
    "çocuklar için bilim",
    "temel bilimler ansiklopedisi",
    "ilkokula hazırlık",
    "etkileşimli öğrenme",
    "Türkçe bilim",
  ],
  appleWebApp: { capable: true, title: "Doğukan'ın Yeri" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#74ebd5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${baloo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
