import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Filter, Plus, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useLang } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchOrders,
  updateOrderStatus,
  STATUS_LABEL,
  STATUS_STYLES,
  STATUS_ORDER,
  type OrderStatus,
} from "@/lib/admin-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const [lang] = useLang();
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recent-orders"] });
    },
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (q) {
        const hay = `${o.order_code} ${o.customer?.name ?? ""} ${o.customer?.name_fa ?? ""} ${o.package?.code ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, q, filter]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("مدیریت سفارش‌ها", "Order Management")}
        subtitle={t("مشاهده، فیلتر و مدیریت تمامی سفارش‌ها", "View, filter and manage all orders")}
        actions={
          <>
            <Button variant="outline" className="border-white/10 bg-white/5">
              <Download className="me-2 h-4 w-4" />
              {t("خروجی Excel", "Export Excel")}
            </Button>
            <Button className="gradient-primary text-white">
              <Plus className="me-2 h-4 w-4" />
              {t("سفارش جدید", "New Order")}
            </Button>
          </>
        }
      />

      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("جستجو در سفارش‌ها...", "Search orders...")}
              className="h-10 border-white/10 bg-white/5 ltr:pl-9 rtl:pr-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...STATUS_ORDER] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                  filter === s
                    ? "border-[#7C3AED]/50 bg-[#7C3AED]/20 text-white"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                }`}
              >
                {s === "all" ? t("همه", "All") : t(STATUS_LABEL[s].fa, STATUS_LABEL[s].en)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
            <Filter className="me-2 h-3.5 w-3.5" />
            {t("فیلترهای پیشرفته", "Advanced")}
          </Button>
        </div>

        {selected.size > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-2 text-sm">
            <span>{t(`${selected.size} مورد انتخاب شده`, `${selected.size} selected`)}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost">{t("تخصیص", "Assign")}</Button>
              <Button size="sm" variant="ghost">{t("تغییر وضعیت", "Change status")}</Button>
              <Button size="sm" variant="ghost" className="text-rose-300">{t("حذف", "Delete")}</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-3 ps-2 text-start"><Checkbox /></th>
                <th className="pb-3 text-start font-medium">{t("شناسه", "ID")}</th>
                <th className="pb-3 text-start font-medium">{t("مشتری", "Customer")}</th>
                <th className="pb-3 text-start font-medium">{t("پکیج", "Package")}</th>
                <th className="pb-3 text-start font-medium">{t("مسئول", "Assignee")}</th>
                <th className="pb-3 text-start font-medium">{t("وضعیت", "Status")}</th>
                <th className="pb-3 text-start font-medium">{t("مهلت", "Deadline")}</th>
                <th className="pb-3 text-start font-medium">{t("پیشرفت", "Progress")}</th>
                <th className="pb-3 text-end font-medium">{t("مبلغ", "Amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#C084FC]" />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((o) => {
                const custName = isRTL ? (o.customer?.name_fa ?? o.customer?.name) : o.customer?.name;
                const pkgName = isRTL ? o.package?.name_fa : o.package?.name_en;
                const asgName = isRTL ? (o.assignee?.name_fa ?? o.assignee?.name) : o.assignee?.name;
                return (
                  <tr key={o.id} className="group transition-colors hover:bg-white/[0.03]">
                    <td className="py-3 ps-2">
                      <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                    </td>
                    <td className="py-3 font-mono text-xs text-[#C084FC]">#{o.order_code}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-white/10 text-[10px]">
                            {(o.customer?.name ?? "?").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{custName ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{pkgName ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">{asgName ?? "—"}</td>
                    <td className="py-3">
                      <Select
                        value={o.status}
                        onValueChange={(v) => statusMut.mutate({ id: o.id, status: v as OrderStatus })}
                        disabled={statusMut.isPending}
                      >
                        <SelectTrigger
                          className={`h-7 w-auto gap-1 border px-2 py-0 text-xs ${STATUS_STYLES[o.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>
                              {t(STATUS_LABEL[s].fa, STATUS_LABEL[s].en)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {o.deadline ? new Date(o.deadline).toLocaleDateString(isRTL ? "fa-IR" : "en-US") : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={o.progress} className="h-1.5 w-20 bg-white/5 [&>div]:gradient-primary" />
                        <span className="text-xs tabular-nums text-muted-foreground">{o.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-end font-semibold tabular-nums">
                      {Number(o.amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    {t("سفارشی یافت نشد", "No orders found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
