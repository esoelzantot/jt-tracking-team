"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const dict = {
  appName: { en: "Tracking Hub", ar: "تراكينج هب" },
  tagline: { en: "Find who owns any shipper account — in a second.", ar: "اعرف مين المسؤول عن أي شيبر — في ثانية." },
  navSearch: { en: "Search", ar: "البحث" },
  navAgents: { en: "Agents", ar: "الإيجنتس" },
  navBranches: { en: "Branches", ar: "الفروع" },
  navDashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  searchPlaceholder: { en: "Type a client name or code…  e.g. J0086…", ar: "اكتب اسم العميل أو الكود…  مثال: J0086…" },
  searchHint: { en: "Press / to search anywhere", ar: "اضغط / للبحث من أي مكان" },
  noResults: { en: "No matching shipper", ar: "مفيش شيبر مطابق" },
  noResultsHint: { en: "Try part of the name or the last digits of the code.", ar: "جرّب جزء من الاسم أو آخر أرقام الكود." },
  results: { en: "results", ar: "نتيجة" },
  clearSearch: { en: "Clear search", ar: "مسح البحث" },
  routing: { en: "Routing", ar: "مسار المتابعة" },
  handlingNow: { en: "Handling now", ar: "ماسك دلوقتي" },
  callNow: { en: "Call", ar: "اتصال" },
  portfolio: { en: "Accounts portfolio", ar: "محفظة الأكونتات" },
  portfolioSub: { en: "Everything this agent owns, at a glance.", ar: "كل اللي الإيجنت ده مسؤول عنه في نظرة واحدة." },
  primaryClients: { en: "Primary clients", ar: "عملاء أساسيين" },
  supportClients: { en: "Backing up", ar: "بديل لعملاء" },
  ifAway: { en: "When away, accounts route to", ar: "وقت الغياب الأكونتات بتروح لـ" },
  noCoverSet: { en: "No cover agent set", ar: "مفيش بديل متحدد" },
  awayBanner: { en: "is away — searches route to the cover agent.", ar: "غير متاح — البحث بيوديك للبديل." },
  awayNoCover: { en: "is away and has no available cover.", ar: "غير متاح ومفيش بديل متاح." },
  coversFor: { en: "Covers for", ar: "بيغطي مكان" },
  allBranches: { en: "All branches", ar: "كل الفروع" },
  employeeBadge: { en: "Tracking Team", ar: "تراكينج تيم" },
  openProfile: { en: "Open", ar: "فتح" },
  coverageTitle: { en: "Who covers these accounts?", ar: "مين هيغطي الأكونتات دي؟" },
  coverageBody: {
    en: "clients managed by this agent have no support agent. Pick a cover agent so searches route to someone available.",
    ar: "عميل تبع الإيجنت ده ملهمش إيجنت بديل. اختار بديل عشان البحث يوديك لحد متاح.",
  },
  coverageWarn: { en: "accounts without cover", ar: "أكونت من غير بديل" },
  setCover: { en: "Set cover agent", ar: "تعيين البديل" },
  skipForNow: { en: "Skip for now", ar: "تخطي دلوقتي" },
  coverUnavailable: { en: "The chosen cover agent is not available either.", ar: "البديل المختار مش متاح هو كمان." },
  clientCode: { en: "Client code", ar: "كود العميل" },
  clientName: { en: "Client name", ar: "اسم العميل" },
  pickupBranch: { en: "Pickup branch", ar: "فرع الاستلام" },
  area: { en: "Area", ar: "المنطقة" },
  accountManager: { en: "Account manager", ar: "الأكونت مانجر" },
  supportAgent: { en: "Support agent", ar: "الإيجنت البديل" },
  contactNow: { en: "Contact now", ar: "تواصل الآن مع" },
  onLeave: { en: "On leave", ar: "إجازة" },
  off: { en: "Off", ar: "غير متاح" },
  active: { en: "Available", ar: "متاح" },
  primaryAway: { en: "Primary agent is away — the support agent is handling this account.", ar: "الإيجنت الأساسي غير متاح — الإيجنت البديل هو اللي ماسك الأكونت." },
  nobody: { en: "Primary agent is away and no available support agent is set.", ar: "الإيجنت الأساسي غير متاح ومفيش إيجنت بديل متاح." },
  unassigned: { en: "No account manager assigned yet.", ar: "لسه مفيش أكونت مانجر متحدد." },
  sharedBranch: { en: "Shared branch — agents on this branch:", ar: "فرع مشترك — الإيجنتس على الفرع ده:" },
  avgPerDay: { en: "Avg shipments / day", ar: "متوسط الشحنات / يوم" },
  totalCustomers: { en: "Total customers", ar: "إجمالي العملاء" },
  clients: { en: "Clients", ar: "العملاء" },
  branches: { en: "Branches", ar: "الفروع" },
  agents: { en: "Agents", ar: "الإيجنتس" },
  agentId: { en: "Agent ID", ar: "ID الإيجنت" },
  agentName: { en: "Agent name", ar: "اسم الإيجنت" },
  copy: { en: "Copy", ar: "نسخ" },
  copied: { en: "Copied", ar: "تم النسخ" },
  viewProfile: { en: "View profile", ar: "عرض البروفايل" },
  coveredBy: { en: "Covered by", ar: "بيغطي مكانه" },
  backups: { en: "Support for", ar: "بديل لـ" },
  asPrimary: { en: "Primary", ar: "أساسي" },
  asSupport: { en: "Support", ar: "بديل" },
  filterAll: { en: "All", ar: "الكل" },
  filterArea: { en: "Area", ar: "المنطقة" },
  search: { en: "Search", ar: "بحث" },
  emptyTitle: { en: "No data yet", ar: "لسه مفيش داتا" },
  emptyBody: { en: "Import the Tracking Team Excel file from the dashboard to get started.", ar: "ارفع شيت الـ Tracking Team من لوحة التحكم عشان تبدأ." },
  goDashboard: { en: "Open dashboard", ar: "افتح لوحة التحكم" },
  loading: { en: "Loading…", ar: "جاري التحميل…" },
  demoMode: { en: "Demo mode — data is stored in this browser only. Add Firebase keys to .env.local to go live.", ar: "وضع تجريبي — الداتا محفوظة في المتصفح ده بس. ضيف مفاتيح Firebase في ‎.env.local عشان تشتغل أونلاين." },
  login: { en: "Sign in", ar: "تسجيل الدخول" },
  logout: { en: "Sign out", ar: "تسجيل الخروج" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  loginTitle: { en: "Dashboard access", ar: "دخول لوحة التحكم" },
  loginBody: { en: "Only the tracking team admins can edit data.", ar: "تعديل الداتا متاح لأدمنز التراكينج تيم بس." },
  overview: { en: "Overview", ar: "نظرة عامة" },
  import: { en: "Import Excel", ar: "استيراد Excel" },
  add: { en: "Add", ar: "إضافة" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  confirmDelete: { en: "Delete this record? This can't be undone.", ar: "متأكد إنك عايز تحذف؟ مش هينفع ترجعه." },
  none: { en: "— None —", ar: "— لا يوجد —" },
  status: { en: "Status", ar: "الحالة" },
  gender: { en: "Gender", ar: "النوع" },
  male: { en: "Male", ar: "ذكر" },
  female: { en: "Female", ar: "أنثى" },
  hijab: { en: "Hijab avatar", ar: "أفاتار بحجاب" },
  phone: { en: "Phone", ar: "التليفون" },
  coverAgent: { en: "Default cover agent", ar: "البديل الافتراضي" },
  coverAgentHint: { en: "Handles all this agent's accounts while away, unless a client has its own support agent.", ar: "بيمسك كل أكونتات الإيجنت ده وقت غيابه، إلا لو العميل ليه إيجنت بديل خاص." },
  notes: { en: "Notes", ar: "ملاحظات" },
  branchName: { en: "Branch name", ar: "اسم الفرع" },
  needsAssignment: { en: "Need an account manager", ar: "محتاجين أكونت مانجر" },
  agentsAway: { en: "Agents away today", ar: "إيجنتس غايبين النهارده" },
  noSupport: { en: "Away with no cover", ar: "غايبين من غير بديل" },
  assign: { en: "Assign", ar: "تعيين" },
  dropFile: { en: "Drop the .xlsx file here or click to choose", ar: "اسحب ملف الـ ‎.xlsx هنا أو دوس للاختيار" },
  importMerge: { en: "Merge (keep dashboard edits)", ar: "دمج (يحافظ على تعديلات لوحة التحكم)" },
  importReplace: { en: "Replace everything", ar: "استبدال كل الداتا" },
  importPreview: { en: "Preview", ar: "معاينة" },
  importDone: { en: "Import complete", ar: "تم الاستيراد" },
  warnings: { en: "Warnings", ar: "تنبيهات" },
  export: { en: "Export Excel", ar: "تصدير Excel" },
  bulkAssign: { en: "Assign selected to", ar: "تعيين المحدد لـ" },
  selected: { en: "selected", ar: "محدد" },
  topBranches: { en: "Busiest branches", ar: "أكتر الفروع شغل" },
  workload: { en: "Agent workload", ar: "حِمل الإيجنتس" },
  perDay: { en: "/day", ar: "/يوم" },
  quickStatus: { en: "Quick status", ar: "تغيير الحالة سريعاً" },
  tempId: { en: "Temporary ID — update it", ar: "ID مؤقت — حدّثه" },
  required: { en: "Required", ar: "مطلوب" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  error: { en: "Something went wrong", ar: "حصلت مشكلة" },
  back: { en: "Back", ar: "رجوع" },
  recent: { en: "Recent searches", ar: "عمليات بحث سابقة" },
  shipments: { en: "shipments/day", ar: "شحنة/يوم" },
  noAgent: { en: "No agent", ar: "بدون إيجنت" },
} as const;

export type DictKey = keyof typeof dict;

interface I18n {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (k: DictKey) => string;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jt-hub:lang");
      if (saved === "en" || saved === "ar") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("jt-hub:lang", l);
    } catch {}
  }, []);

  const t = useCallback((k: DictKey) => dict[k][lang], [lang]);

  return <Ctx.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t, setLang }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}
