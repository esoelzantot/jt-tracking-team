import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
        <Link href="/" aria-label="J&T Express">
          <Image src="/brand/logo-wordmark.png" alt="J&T Express" width={324} height={75} className="h-7 w-auto" />
        </Link>
        <p className="text-sm font-medium text-ink-3">
          <span dir="ltr">J&amp;T Express</span> · دليل داخلي لنظام الشحن
        </p>
      </div>
      <div className="border-t border-line bg-jt-50/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1.5 px-4 py-4 text-sm text-ink-2 sm:flex-row sm:justify-between">
          <p>
            <span dir="ltr">© {year} J&amp;T Express.</span> جميع الحقوق محفوظة.
          </p>
          <p>
            تصميم وتنفيذ{" "}
            <span dir="ltr" className="font-bold text-jt-700">
              Eng. Eslam Shaker
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
