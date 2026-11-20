import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Tracking Hub · J&T Express",
  description: "Find the account manager and support agent for any shipper instantly.",
  icons: { icon: "/brand/logo-square.jpg" },
};

export const viewport: Viewport = { themeColor: "#e3222b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} antialiased`}>
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
