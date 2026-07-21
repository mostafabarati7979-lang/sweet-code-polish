import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Star, TrendingUp, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { useLang } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { fetchCustomers, type CustomerTag } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

const TAG_LABEL: Record<CustomerTag | "all", { fa: string; en: string }> = {
  all: { fa: "همه", en: "All" },
  vip: { fa: "VIP", en: "VIP" },
  loyal: { fa: "وفادار", en: "Loyal" },
  new: { fa: "جدید", en: "New" },
};

function CustomersPage() {
  const [lang] = useLang();
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<CustomerTag | "all">("all");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (tag !== "all" && c.tag !== tag) return false;
      if (q) {
        const hay = `${c.name} ${c.name_fa ?? ""} ${c.email ?? ""} ${c.industry ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [customers, q, tag]);

  const stats = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.tag === "vip").length;
    const avgScore = total ? Math.round(customers.reduce((s, c) => s + c.score, 0) / total) : 0;
    const avgLtv = total ? Math.round(customers.reduce((s, c) => s + Number(c.ltv), 0) / total) : 0;
    return { total, vip, avgScore, avgLtv };
  }, [customers]);

  const relTime = (iso: string | null) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d <= 0) return t("امروز", "Today");
    if (d === 1) return t("۱ روز پیش", "1 day ago");
    if (d < 7) return t(`${d} روز پیش`, `${d} days ago`);
    const w = Math.floor(d / 7);
    return t(`${w} هفته پیش`, `${w} weeks ago`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("مدیریت مشتریان (CRM)", "Customer CRM")}
        subtitle={t("پروفایل کامل، تاریخچه خرید و امتیازدهی", "Complete profiles, purchase history & scoring")}
        actions={<Button className="gradient-primary text-white">{t("افزودن مشتری", "Add Customer")}</Button>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("کل مشتریان", "Total Customers")} value={stats.total} icon={Users} accent="purple" />
        <StatCard label={t("مشتریان VIP", "VIP Customers")} value={stats.vip} icon={Star} accent="violet" />
        <StatCard label={t("امتیاز میانگین", "Avg. Score")} value={stats.avgScore} suffix="/100" icon={TrendingUp} accent="pink" />
        <StatCard label={t("ارزش عمر میانگین", "Avg. LTV")} value={stats.avgLtv} icon={Star} accent="blue" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("جستجوی مشتری...", "Search customers...")}
            className="h-10 max-w-sm border-white/10 bg-white/5"
          />
          <div className="ms-auto flex gap-1.5">
            {(["all", "vip", "loyal", "new"] as const).map((k) => (
              <Badge
                key={k}
                onClick={() => setTag(k)}
                variant="outline"
                className={`cursor-pointer border-white/10 bg-white/5 hover:border-[#7C3AED]/50 ${
                  tag === k ? "border-[#7C3AED]/60 bg-[#7C3AED]/20 text-white" : ""
                }`}
              >
                {t(TAG_LABEL[k].fa, TAG_LABEL[k].en)}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#C084FC]" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="glass group relative overflow-hidden rounded-2xl p-4 transition-all hover:glow-purple">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 ring-2 ring-[#7C3AED]/40">
                      <AvatarFallback className="gradient-primary text-sm font-bold text-white">
                        {c.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{isRTL ? (c.name_fa ?? c.name) : c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.industry ?? "—"}</div>
                    </div>
                  </div>
                  <Badge
                    className={
                      c.tag === "vip"
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                        : c.tag === "loyal"
                          ? "border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C084FC]"
                          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    }
                  >
                    {t(TAG_LABEL[c.tag].fa, TAG_LABEL[c.tag].en)}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{c.email ?? "—"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{c.phone ?? "—"}</div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("ارزش عمر", "LTV")}</div>
                    <div className="text-sm font-bold tabular-nums text-[#C084FC]">{Number(c.ltv).toLocaleString()}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("امتیاز", "Score")}</div>
                    <div className="text-sm font-bold tabular-nums">{c.score}/100</div>
                  </div>
                  <div className="text-end">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("فعالیت", "Activity")}</div>
                    <div className="text-xs text-muted-foreground">{relTime(c.last_activity_at)}</div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                {t("مشتری‌ای یافت نشد", "No customers found")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
