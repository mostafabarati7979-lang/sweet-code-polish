import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Users, Sparkles, Receipt, CreditCard,
  Bell, BarChart3, PieChart, Repeat2, Search, ShieldCheck,
  Globe, Moon, ChevronsLeft, ChevronsRight, Menu, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type NavItem = { to: string; icon: React.ComponentType<{ className?: string }>; fa: string; en: string };
type NavGroup = { fa: string; en: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    fa: "کلی", en: "Overview",
    items: [
      { to: "/admin", icon: LayoutDashboard, fa: "داشبورد", en: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3, fa: "تحلیل‌ها", en: "Analytics" },
      { to: "/admin/reports", icon: PieChart, fa: "گزارش‌ها", en: "Reports" },
    ],
  },
  {
    fa: "فروش", en: "Sales",
    items: [
      { to: "/admin/orders", icon: ShoppingCart, fa: "سفارش‌ها", en: "Orders" },
      { to: "/admin/customers", icon: Users, fa: "مشتریان (CRM)", en: "Customers" },
      { to: "/admin/invoices", icon: Receipt, fa: "فاکتورها", en: "Invoices" },
      { to: "/admin/payments", icon: CreditCard, fa: "پرداخت‌ها", en: "Payments" },
      { to: "/admin/subscriptions", icon: Repeat2, fa: "اشتراک‌ها", en: "Subscriptions" },
    ],
  },
  {
    fa: "سیستم", en: "System",
    items: [
      { to: "/admin/users", icon: ShieldCheck, fa: "کاربران و نقش‌ها", en: "Users & Roles" },
    ],
  },
];

type Lang = "fa" | "en";
const LANG_EVENT = "ai-motion-lang-change";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fa";
    return (localStorage.getItem("ai-motion-lang") as Lang) || "fa";
  });
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
      localStorage.setItem("ai-motion-lang", lang);
    }
  }, [lang]);
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<Lang>).detail;
      setLangState(next);
    };
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
    }
  };
  return [lang, setLang];
}

export function AdminLayout() {
  const [lang, setLang] = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRTL = lang === "fa";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [initials, setInitials] = useState<string>("AM");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserEmail(email);
      const meta = (data.user?.user_metadata ?? {}) as { full_name?: string };
      const src = meta.full_name || email;
      const parts = src.trim().split(/[\s@._-]+/).filter(Boolean);
      const ini = (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "M");
      setInitials(ini.toUpperCase().slice(0, 2));
    });
  }, []);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success(isRTL ? "خروج موفق" : "Signed out");
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="admin-theme dark min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 z-40 flex flex-col transition-all duration-300",
            isRTL ? "right-0" : "left-0",
            collapsed ? "w-[76px]" : "w-[260px]",
            "border-e border-[color:var(--sidebar-border)] bg-[color:var(--sidebar)] backdrop-blur-xl",
            mobileOpen ? "translate-x-0" : "",
            !mobileOpen && "max-md:-translate-x-full max-md:rtl:translate-x-full",
          )}
        >
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary glow-purple">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight text-foreground">AI Motion</div>
                <div className="truncate text-xs text-muted-foreground">Studio Admin</div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {NAV.map((group) => (
              <div key={group.en} className="mb-4">
                {!collapsed && (
                  <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {isRTL ? group.fa : group.en}
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((it) => {
                    const active = pathname === it.to || (it.to !== "/admin" && pathname.startsWith(it.to));
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                          active
                            ? "bg-gradient-to-l from-[#7C3AED]/40 to-[#A855F7]/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "text-[color:var(--sidebar-foreground)]/80 hover:bg-[color:var(--sidebar-accent)] hover:text-white",
                        )}
                      >
                        {active && (
                          <span
                            className={cn(
                              "absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full gradient-primary",
                              isRTL ? "right-0" : "left-0",
                            )}
                          />
                        )}
                        <it.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{isRTL ? it.fa : it.en}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[color:var(--sidebar-border)] p-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-[color:var(--sidebar-accent)] hover:text-white md:flex"
            >
              {collapsed ? (isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />) : (
                <>
                  {isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                  <span>{isRTL ? "جمع کردن" : "Collapse"}</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main */}
        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-all duration-300",
            collapsed ? (isRTL ? "md:mr-[76px]" : "md:ml-[76px]") : (isRTL ? "md:mr-[260px]" : "md:ml-[260px]"),
          )}
        >
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0B1120]/60 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="relative hidden max-w-md flex-1 sm:block">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
                <Input
                  placeholder={isRTL ? "جستجو در پنل..." : "Search everything..."}
                  className="h-10 border-white/10 bg-white/5 ltr:pl-9 rtl:pr-9"
                />
                <kbd className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground ltr:right-3 rtl:left-3 md:inline-flex">
                  ⌘K
                </kbd>
              </div>
              <div className="flex-1 sm:hidden" />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full border border-white/10 bg-white/5 px-3"
                  onClick={() => setLang(lang === "fa" ? "en" : "fa")}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold">{lang === "fa" ? "EN" : "فا"}</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full border border-white/10 bg-white/5">
                  <Moon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="relative rounded-full border border-white/10 bg-white/5">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC]" />
                </Button>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pe-3 ps-1">
                  <Avatar className="h-8 w-8 ring-2 ring-[#7C3AED]/40">
                    <AvatarFallback className="gradient-primary text-xs font-bold text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-xs leading-tight sm:block">
                    <div className="font-semibold text-foreground">{userEmail || (isRTL ? "کاربر" : "User")}</div>
                    <div className="text-muted-foreground">{isRTL ? "مدیر" : "Admin"}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title={isRTL ? "خروج" : "Sign out"}
                  className="rounded-full border border-white/10 bg-white/5 hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>

          <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-muted-foreground">
            {isRTL ? (
              <>© ۲۰۲۶ AI Motion Studio — پنل مدیریت نسخه ۱٫۰</>
            ) : (
              <>© 2026 AI Motion Studio — Admin Panel v1.0</>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

export { NAV };
