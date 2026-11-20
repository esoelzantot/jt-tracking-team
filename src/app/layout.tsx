import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const beiruti = localFont({
  variable: "--font-beiruti",
  display: "swap",
  src: [
    { path: "./fonts/beiruti/Beiruti-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/beiruti/Beiruti-Black.ttf", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Tracking Hub · J&T Express",
  description: "Find the account manager and support agent for any shipper instantly.",
  icons: { icon: "/brand/logo-square.jpg" },
};

export const viewport: Viewport = { themeColor: "#e3222b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={beiruti.variable} suppressHydrationWarning>
      <body className="antialiased">
        <I18nProvider>
          <StoreProvider>
            <Header />
            <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
