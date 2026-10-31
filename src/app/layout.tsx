import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { SpeechProvider } from "@/components/SpeechProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { AppOverlays } from "@/components/wellbeing/AppOverlays";
import "./globals.css";

// Baloo 500 hiçbir yerde kullanılmıyor; Nunito 600 ise düğme ve etiketlerde kullanıldığı için kalır.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
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
  appleWebApp: {
    capable: true,
    title: "Doğukan'ın Yeri",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#74ebd5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${baloo.variable} ${nunito.variable}`}>
      <body>
        <SpeechProvider>{children}</SpeechProvider>
        <AppOverlays />
        <PwaRegister />
      </body>
    </html>
  );
}
