"use client";

import { motion } from "framer-motion";
import { Building2, LayoutDashboard, Languages, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { firebaseEnabled } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const path = usePathname();
  const links = [
    { href: "/", label: t("navSearch"), icon: Search },
    { href: "/agents", label: t("navAgents"), icon: Users },
    { href: "/branches", label: t("navBranches"), icon: Building2 },
    { href: "/dashboard", label: t("navDashboard"), icon: LayoutDashboard },
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {!firebaseEnabled && (
        <div className="bg-jt-50 px-4 py-1.5 text-center text-xs font-bold text-jt-700">{t("demoMode")}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/logo-square.jpg" alt="J&T Express" width={40} height={40} className="size-10 rounded-xl object-cover" />
            <div className="hidden leading-tight sm:block">
              <div className="text-[15px] font-black">{t("appName")}</div>
              <div className="text-[11px] font-semibold text-ink-3">J&amp;T Express · Tracking Team</div>
            </div>
          </Link>

          <nav className="ms-auto hidden items-center gap-1 rounded-2xl bg-bg p-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                  isActive(l.href) ? "text-white" : "text-ink-2 hover:text-ink",
                )}
              >
                {isActive(l.href) && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-jt shadow-lg shadow-jt/30" transition={{ type: "spring", damping: 28, stiffness: 380 }} />
                )}
                <l.icon className="relative size-4" />
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="btn btn-ghost ms-auto !px-3 md:ms-0"
            aria-label="Switch language"
          >
            <Languages className="size-4" />
            <span className="text-sm">{lang === "ar" ? "EN" : "عربي"}</span>
          </button>
        </div>
      </header>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-line bg-surface/95 p-1 shadow-xl backdrop-blur md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold",
              isActive(l.href) ? "bg-jt text-white" : "text-ink-2",
            )}
          >
            <l.icon className="size-5" />
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
